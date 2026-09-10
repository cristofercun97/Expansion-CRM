import {createHash} from "node:crypto";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {createCalendarEventForUid} from "../calendar/googleCalendar.js";
import {
  BOOKING_MAX_ADVANCE_DAYS,
  BOOKING_PRIVACY_VERSION,
  buildLockId,
  computePublicAvailability,
  daySpanInclusive,
  formatDateKey,
  isSlotFree,
  mapBookingConfig,
  resolveSlotStartMs,
  zonedParts,
  type BusyInterval,
  type BookingConfig,
} from "./availability.js";
import {
  sanitizeAvailabilityRequest,
  sanitizeCreateBookingRequest,
} from "./sanitize.js";
import {
  ensurePublicBookingConversionEffects,
  recordPresentationFunnelEvent,
  assertNoPiiInFunnelPayload,
  type PresentationFunnelEventKind,
} from "./conversion.js";
import {
  buildPublicBookingProfessional,
  extractOwnerPublicProfileFields,
  type PublicBookingProfessional,
} from "./professionalMeta.js";
import {
  isRateLimitExceeded,
  rateLimitDocId,
  type BookingRateKind,
} from "./rateLimit.js";

const googleOAuthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOAuthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const googleOAuthRedirectUri = defineSecret("GOOGLE_OAUTH_REDIRECT_URI");
const appBaseUrl = defineSecret("APP_BASE_URL");

function asHttpsError(error: unknown): never {
  if (error instanceof HttpsError) throw error;
  const err = error as {code?: string; reason?: string; message?: string};
  const code =
    err.code === "invalid-argument" ||
    err.code === "failed-precondition" ||
    err.code === "not-found" ||
    err.code === "already-exists" ||
    err.code === "resource-exhausted"
      ? err.code
      : "internal";
  throw new HttpsError(code, err.message || "Error interno.", {reason: err.reason});
}

async function resolvePublishedPresentation(slug: string): Promise<{
  ownerUid: string;
  slug: string;
  brandName: string;
  booking: BookingConfig;
  professional: PublicBookingProfessional;
}> {
  const db = getDefaultFirestore();
  const slugSnap = await db.collection(COLLECTIONS.slugs).doc(slug).get();
  if (!slugSnap.exists || slugSnap.data()?.isActive === false) {
    throw new HttpsError("not-found", "Presentación no encontrada.");
  }
  const ownerUid = String(slugSnap.data()?.uid || "");
  if (!ownerUid) {
    throw new HttpsError("not-found", "Presentación no encontrada.");
  }

  const landingSnap = await db.collection(COLLECTIONS.leaderLandingPages).doc(ownerUid).get();
  if (!landingSnap.exists) {
    throw new HttpsError("not-found", "Presentación no encontrada.");
  }
  const landing = landingSnap.data() || {};
  if (landing.isPublished !== true) {
    throw new HttpsError("not-found", "Presentación no disponible.");
  }
  const landingSlug = String(landing.slug || slug).toLowerCase();
  if (landingSlug !== slug) {
    throw new HttpsError("not-found", "Presentación no encontrada.");
  }

  const booking = mapBookingConfig(landing.booking);
  if (!booking.enabled) {
    throw new HttpsError(
      "failed-precondition",
      "Las reservas no están disponibles en este momento.",
      {reason: "booking_disabled"},
    );
  }

  const ownerSnap = await db.collection(COLLECTIONS.users).doc(ownerUid).get();
  const ownerFields = extractOwnerPublicProfileFields(
    ownerSnap.exists ? (ownerSnap.data() as Record<string, unknown>) : null,
  );
  const professional = buildPublicBookingProfessional(
    landing as Record<string, unknown>,
    ownerFields,
  );
  const brandName = professional.displayName;

  return {ownerUid, slug, brandName, booking, professional};
}

async function loadBusyIntervals(
  organizerId: string,
  rangeStartMs: number,
  rangeEndMs: number,
): Promise<BusyInterval[]> {
  const db = getDefaultDb();
  const snap = await db
    .collection(COLLECTIONS.meetings)
    .where("organizerId", "==", organizerId)
    .where("startAt", ">=", Timestamp.fromMillis(rangeStartMs))
    .where("startAt", "<=", Timestamp.fromMillis(rangeEndMs))
    .get();

  const busy: BusyInterval[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const status = String(data.status || "");
    if (status === "cancelled" || status === "completed" || status === "no_show") continue;
    const startAt = data.startAt?.toMillis?.() ?? null;
    const endAt = data.endAt?.toMillis?.() ?? null;
    if (typeof startAt !== "number" || typeof endAt !== "number") continue;
    // Privacy: only intervals — never title/participants/urls.
    busy.push({startMs: startAt, endMs: endAt});
  }
  return busy;
}

function getDefaultDb() {
  return getDefaultFirestore();
}

function idempotencyDocId(organizerId: string, clientRequestId: string): string {
  return createHash("sha256")
    .update(`${organizerId}:${clientRequestId}`)
    .digest("hex")
    .slice(0, 64);
}

function fingerprint(request: {rawRequest?: {headers?: Record<string, unknown>; ip?: string}}): string {
  const forwarded = request.rawRequest?.headers?.["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : "") ||
    request.rawRequest?.ip ||
    "unknown";
  return `ip_${ip}`.slice(0, 120);
}

async function assertRateLimit(
  fingerprintKey: string,
  kind: BookingRateKind,
): Promise<void> {
  const ref = getDefaultDb()
    .collection(COLLECTIONS.bookingRateLimits)
    .doc(rateLimitDocId(fingerprintKey, kind));
  await getDefaultDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = Number(snap.data()?.count || 0);
    if (isRateLimitExceeded(count, kind)) {
      throw new HttpsError(
        "resource-exhausted",
        "Demasiadas solicitudes. Inténtalo más tarde.",
        {reason: "rate_limited"},
      );
    }
    tx.set(
      ref,
      {
        count: count + 1,
        kind,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
  });
}

async function findOrCreateProspect(input: {
  ownerUid: string;
  slug: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  whatsapp: string;
  sessionReason: string;
  objective: string;
  message: string;
}): Promise<string> {
  const db = getDefaultDb();
  const email = input.email.toLowerCase();
  try {
    const existing = await db
      .collection(COLLECTIONS.prospects)
      .where("ownerUid", "==", input.ownerUid)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      const current = existing.docs[0].data();
      const patch: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
        lastInteractionAt: FieldValue.serverTimestamp(),
        source: current.source || "presentation_booking",
        presentationSlug: input.slug,
      };
      const fullName = `${input.firstName} ${input.lastName}`.trim();
      if (!current.name && fullName) patch.name = fullName;
      if (!current.whatsapp && input.whatsapp) patch.whatsapp = input.whatsapp;
      if (!current.city && input.city) patch.city = input.city;
      if (!current.countryName && input.country) patch.countryName = input.country;
      if (!current.email) patch.email = email;
      await docRef.set(patch, {merge: true});
      return docRef.id;
    }
  } catch {
    const snap = await db
      .collection(COLLECTIONS.prospects)
      .where("ownerUid", "==", input.ownerUid)
      .limit(200)
      .get();
    const matched = snap.docs.find(
      (item) => String(item.data().email || "").toLowerCase() === email,
    );
    if (matched) {
      await matched.ref.set(
        {
          updatedAt: FieldValue.serverTimestamp(),
          lastInteractionAt: FieldValue.serverTimestamp(),
          presentationSlug: input.slug,
        },
        {merge: true},
      );
      return matched.id;
    }
  }

  const created = await db.collection(COLLECTIONS.prospects).add({
    ownerUid: input.ownerUid,
    leaderId: input.ownerUid,
    landingSlug: input.slug,
    presentationSlug: input.slug,
    source: "presentation_booking",
    status: "new",
    name: `${input.firstName} ${input.lastName}`.trim(),
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    countryName: input.country,
    city: input.city,
    whatsapp: input.whatsapp || null,
    interest: input.sessionReason,
    objective: input.objective,
    message: input.message,
    privacyAccepted: true,
    privacyAcceptedAt: FieldValue.serverTimestamp(),
    privacyVersion: BOOKING_PRIVACY_VERSION,
    lastInteractionAt: FieldValue.serverTimestamp(),
    bookingCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return created.id;
}

export const getPublicBookingAvailability = onCall(callableOptions, async (request) => {
  try {
    await assertRateLimit(fingerprint(request), "availability");
    const input = sanitizeAvailabilityRequest(request.data);
    const presentation = await resolvePublishedPresentation(input.slug);

    const span = daySpanInclusive(input.dateFrom, input.dateTo);
    if (span > BOOKING_MAX_ADVANCE_DAYS) {
      throw new HttpsError("invalid-argument", "El rango máximo es de 31 días.");
    }

    const fromParts = zonedParts(
      new Date(`${input.dateFrom}T00:00:00.000Z`),
      presentation.booking.timezone,
    );
    const toParts = zonedParts(
      new Date(`${input.dateTo}T23:59:59.000Z`),
      presentation.booking.timezone,
    );
    const rangeStartMs = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day) - 86400000;
    const rangeEndMs = Date.UTC(toParts.year, toParts.month - 1, toParts.day) + 2 * 86400000;

    const busy = await loadBusyIntervals(presentation.ownerUid, rangeStartMs, rangeEndMs);
    const availability = computePublicAvailability({
      nowMs: Date.now(),
      rangeStartDateKey: input.dateFrom,
      rangeEndDateKey: input.dateTo,
      config: presentation.booking,
      busy,
    });

    return {
      professional: presentation.professional,
      professionalName: presentation.professional.displayName,
      bookingTitle: presentation.booking.title,
      bookingDescription: presentation.booking.description,
      ...availability,
    };
  } catch (error) {
    asHttpsError(error);
  }
});

export const createPublicBooking = onCall(
  {
    ...callableOptions,
    secrets: [googleOAuthClientId, googleOAuthClientSecret, googleOAuthRedirectUri, appBaseUrl],
  },
  async (request) => {
    try {
      await assertRateLimit(fingerprint(request), "create");
      const input = sanitizeCreateBookingRequest(request.data);
      const presentation = await resolvePublishedPresentation(input.slug);
      const {booking, ownerUid, brandName} = presentation;

      const startMs = resolveSlotStartMs(
        input.selectedDate,
        input.selectedTime,
        booking.timezone,
      );
      if (startMs == null) {
        throw new HttpsError("invalid-argument", "Horario inválido.");
      }
      const endMs = startMs + booking.durationMinutes * 60_000;
      if (startMs <= Date.now()) {
        throw new HttpsError("failed-precondition", "Ese horario ya no está disponible.");
      }

      const todayParts = zonedParts(new Date(), booking.timezone);
      const todayKey = formatDateKey(todayParts);
      const maxKeyDate = new Date(Date.now() + BOOKING_MAX_ADVANCE_DAYS * 86400000);
      const maxKey = formatDateKey(zonedParts(maxKeyDate, booking.timezone));
      if (input.selectedDate < todayKey || input.selectedDate > maxKey) {
        throw new HttpsError("invalid-argument", "Fecha fuera de rango.");
      }

      const idempotencyId = idempotencyDocId(ownerUid, input.clientRequestId);
      const lockId = buildLockId(ownerUid, startMs);
      const db = getDefaultDb();
      const idempotencyRef = db.collection(COLLECTIONS.bookingIdempotency).doc(idempotencyId);
      const lockRef = db.collection(COLLECTIONS.bookingLocks).doc(lockId);

      const existingIdem = await idempotencyRef.get();
      if (existingIdem.exists) {
        const prior = existingIdem.data() || {};
        const priorBookingId = String(prior.bookingId || "");
        const priorContactId = String(prior.contactId || "");
        if (priorBookingId && priorContactId) {
          await ensurePublicBookingConversionEffects({
            bookingId: priorBookingId,
            ownerUid,
            contactId: priorContactId,
            presentationSlug: input.slug,
            leadName: String(prior.leadName || ""),
            dateLabel: String(prior.date || input.selectedDate),
            timeLabel: String(prior.time || input.selectedTime),
            durationMinutes: booking.durationMinutes,
          });
        }
        return {
          bookingId: priorBookingId,
          professionalName: brandName,
          date: input.selectedDate,
          time: input.selectedTime,
          timezone: booking.timezone,
          duration: booking.durationMinutes,
          meetingMode: booking.googleMeet ? "video" : "other",
          googleMeetAvailable: Boolean(prior.googleMeetAvailable),
          idempotent: true,
        };
      }

      // Revalidate availability against live busy set (not cached UI).
      const busy = await loadBusyIntervals(ownerUid, startMs - 3600000, endMs + 3600000);
      if (!isSlotFree(startMs, endMs, busy)) {
        throw new HttpsError(
          "failed-precondition",
          "Ese horario acaba de reservarse. Elige otro disponible.",
        );
      }

      const contactId = await findOrCreateProspect({
        ownerUid,
        slug: input.slug,
        firstName: input.lead.firstName,
        lastName: input.lead.lastName,
        email: input.lead.email,
        country: input.lead.country,
        city: input.lead.city,
        whatsapp: input.lead.whatsapp,
        sessionReason: input.lead.sessionReason,
        objective: input.lead.objective,
        message: input.lead.message,
      });

      const fullName = `${input.lead.firstName} ${input.lead.lastName}`.trim();
      const meetingTitle = `Sesión con ${fullName}`;

      const meetingRef = db.collection(COLLECTIONS.meetings).doc();
      const bookingId = meetingRef.id;

      await db.runTransaction(async (tx) => {
        const [lockSnap, idemSnap] = await Promise.all([tx.get(lockRef), tx.get(idempotencyRef)]);
        if (idemSnap.exists) {
          return;
        }
        if (lockSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            "Ese horario acaba de reservarse. Elige otro disponible.",
          );
        }

        // Second busy check inside transaction window (best-effort + lock).
        tx.create(lockRef, {
          organizerId: ownerUid,
          startAtMs: startMs,
          endAtMs: endMs,
          meetingId: bookingId,
          clientRequestId: input.clientRequestId,
          createdAt: FieldValue.serverTimestamp(),
        });

        tx.set(meetingRef, {
          title: meetingTitle,
          type: "presentation",
          description: input.lead.message,
          notes: [
            `Motivo: ${input.lead.sessionReason}`,
            `Objetivo: ${input.lead.objective}`,
            input.lead.city ? `Ciudad: ${input.lead.city}` : "",
            input.lead.country ? `País: ${input.lead.country}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          resultNotes: "",
          status: "scheduled",
          startAt: Timestamp.fromMillis(startMs),
          endAt: Timestamp.fromMillis(endMs),
          durationMinutes: booking.durationMinutes,
          timezone: booking.timezone,
          organizerId: ownerUid,
          organizerName: brandName,
          contactId,
          meetingAudience: "individual",
          groupId: null,
          groupNameSnapshot: null,
          participants: [
            {
              type: "contact",
              contactId,
              name: fullName,
              email: input.lead.email,
            },
          ],
          participantUserIds: [],
          meetingMode: booking.googleMeet ? "video" : "other",
          videoProvider: booking.googleMeet ? "google_meet" : "none",
          meetingUrl: null,
          location: null,
          meetingProvider: booking.googleMeet ? "google_meet" : "none",
          googleCalendarEventId: null,
          googleCalendarHtmlLink: null,
          googleMeetUrl: null,
          source: "presentation_booking",
          presentationSlug: input.slug,
          bookingId,
          clientRequestId: input.clientRequestId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: ownerUid,
          updatedBy: ownerUid,
          completedAt: null,
          cancelledAt: null,
          cancelledBy: null,
          cancelReason: null,
          resultRecordedBy: null,
          resultRecordedAt: null,
        });

        tx.set(idempotencyRef, {
          organizerId: ownerUid,
          clientRequestId: input.clientRequestId,
          bookingId,
          contactId,
          leadName: fullName,
          date: input.selectedDate,
          time: input.selectedTime,
          presentationSlug: input.slug,
          createdAt: FieldValue.serverTimestamp(),
          googleMeetAvailable: false,
        });
      });

      await ensurePublicBookingConversionEffects({
        bookingId,
        ownerUid,
        contactId,
        presentationSlug: input.slug,
        leadName: fullName,
        dateLabel: input.selectedDate,
        timeLabel: input.selectedTime,
        durationMinutes: booking.durationMinutes,
      });

      let googleMeetAvailable = false;
      if (booking.googleMeet) {
        try {
          const google = await createCalendarEventForUid(ownerUid, {
            title: meetingTitle,
            description: input.lead.message,
            startAtIso: new Date(startMs).toISOString(),
            endAtIso: new Date(endMs).toISOString(),
            timezone: booking.timezone,
            attendeeEmails: [input.lead.email],
          });
          googleMeetAvailable = Boolean(google.googleMeetUrl);
          await meetingRef.set(
            {
              googleCalendarEventId: google.googleCalendarEventId,
              googleCalendarHtmlLink: google.googleCalendarHtmlLink,
              googleMeetUrl: google.googleMeetUrl,
              meetingUrl: google.googleMeetUrl,
              videoProvider: google.googleMeetUrl ? "google_meet" : "none",
              meetingProvider: google.googleMeetUrl ? "google_meet" : "none",
              updatedAt: FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
          await idempotencyRef.set({googleMeetAvailable}, {merge: true});
        } catch {
          await meetingRef.set(
            {
              googleSyncError: true,
              videoProvider: "none",
              meetingProvider: "none",
              updatedAt: FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
        }
      }

      return {
        bookingId,
        professionalName: brandName,
        date: input.selectedDate,
        time: input.selectedTime,
        timezone: booking.timezone,
        duration: booking.durationMinutes,
        meetingMode: booking.googleMeet ? "video" : "other",
        googleMeetAvailable,
        idempotent: false,
      };
    } catch (error) {
      asHttpsError(error);
    }
  },
);

const FUNNEL_EVENT_KINDS = new Set<PresentationFunnelEventKind>([
  "presentation_view",
  "presentation_booking_click",
  "booking_started",
]);

export const trackPresentationFunnelEvent = onCall(callableOptions, async (request) => {
  try {
    await assertRateLimit(fingerprint(request), "funnel");
    const data =
      request.data && typeof request.data === "object" ?
        (request.data as Record<string, unknown>) :
        {};
    const eventKind = String(data.eventKind || "") as PresentationFunnelEventKind;
    if (!FUNNEL_EVENT_KINDS.has(eventKind)) {
      throw new HttpsError("invalid-argument", "Evento de funnel inválido.");
    }
    const slug = String(data.presentationSlug || data.slug || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9-]{3,48}$/.test(slug)) {
      throw new HttpsError("invalid-argument", "Slug inválido.");
    }

    const payload: Record<string, unknown> = {...data};
    delete payload.eventKind;
    delete payload.presentationSlug;
    delete payload.slug;
    delete payload.clientEventId;
    delete payload.source;
    delete payload.bookingDuration;
    assertNoPiiInFunnelPayload(payload);

    const db = getDefaultDb();
    const slugSnap = await db.collection(COLLECTIONS.slugs).doc(slug).get();
    if (!slugSnap.exists || slugSnap.data()?.isActive === false) {
      throw new HttpsError("not-found", "Presentación no encontrada.");
    }
    const ownerUid = String(slugSnap.data()?.uid || "");
    if (!ownerUid) {
      throw new HttpsError("not-found", "Presentación no encontrada.");
    }

    const result = await recordPresentationFunnelEvent({
      eventKind,
      presentationSlug: slug,
      ownerUid,
      clientEventId: typeof data.clientEventId === "string" ? data.clientEventId : null,
      source: typeof data.source === "string" ? data.source : "presentation",
      bookingDuration:
        typeof data.bookingDuration === "number" ? data.bookingDuration : undefined,
    });

    return {ok: true, ...result};
  } catch (error) {
    asHttpsError(error);
  }
});
