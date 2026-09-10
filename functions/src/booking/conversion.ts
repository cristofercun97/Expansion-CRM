import {FieldValue} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {buildNotificationDedupeKey} from "../meetings/reminderLogic.js";

export type PresentationFunnelEventKind =
  | "presentation_view"
  | "presentation_booking_click"
  | "booking_started"
  | "booking_completed";

export type BookingFunnelMetrics = {
  views: number;
  bookingClicks: number;
  bookings: number;
};

export function emptyBookingFunnelMetrics(): BookingFunnelMetrics {
  return {views: 0, bookingClicks: 0, bookings: 0};
}

export function mapBookingFunnelMetrics(raw: unknown): BookingFunnelMetrics {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    views: Math.max(0, Number(source.views) || 0),
    bookingClicks: Math.max(0, Number(source.bookingClicks) || 0),
    bookings: Math.max(0, Number(source.bookings) || 0),
  };
}

/** clicks → bookings conversion; null when clicks = 0 (UI shows "—"). */
export function bookingClickToBookingRate(metrics: BookingFunnelMetrics): number | null {
  if (metrics.bookingClicks <= 0) return null;
  return (metrics.bookings / metrics.bookingClicks) * 100;
}

export function formatBookingConversionRate(metrics: BookingFunnelMetrics): string {
  const rate = bookingClickToBookingRate(metrics);
  if (rate == null) return "—";
  const rounded = Math.round(rate * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

export function funnelCounterField(
  eventKind: PresentationFunnelEventKind,
): keyof BookingFunnelMetrics | null {
  switch (eventKind) {
  case "presentation_view":
    return "views";
  case "presentation_booking_click":
    return "bookingClicks";
  case "booking_started":
    return null;
  case "booking_completed":
    return "bookings";
  default:
    return null;
  }
}

export function assertNoPiiInFunnelPayload(payload: Record<string, unknown>): void {
  const forbidden = [
    "name",
    "email",
    "phone",
    "whatsapp",
    "message",
    "firstName",
    "lastName",
    "sessionReason",
    "objective",
    "notes",
  ];
  for (const key of forbidden) {
    if (key in payload && payload[key] != null && payload[key] !== "") {
      throw new HttpsError("invalid-argument", "Payload de analytics inválido.");
    }
  }
}

function agendaActionUrl(meetingId: string): string {
  return `/dashboard/agenda?meetingId=${encodeURIComponent(meetingId)}`;
}

async function createNotificationOnce(options: {
  dedupeKey: string;
  recipientUid: string;
  title: string;
  message: string;
  meetingId: string;
  contactId: string;
  leadName: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  actionUrl: string;
  actionLabel: string;
}): Promise<"created" | "exists"> {
  const ref = getDefaultFirestore().collection(COLLECTIONS.notifications).doc(options.dedupeKey);
  try {
    await ref.create({
      recipientUid: options.recipientUid,
      type: "public_booking_created",
      title: options.title,
      message: options.message,
      meetingId: options.meetingId,
      contactId: options.contactId,
      leadName: options.leadName,
      dateLabel: options.dateLabel,
      timeLabel: options.timeLabel,
      durationMinutes: options.durationMinutes,
      source: "presentation_booking",
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
      dedupeKey: options.dedupeKey,
    });
    return "created";
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error ?
        Number((error as {code?: number}).code) :
        0;
    if (code === 6) return "exists";
    throw error;
  }
}

/**
 * Idempotent conversion side-effects for a confirmed public booking.
 * Safe to call on first success and on idempotent retries.
 */
export async function ensurePublicBookingConversionEffects(input: {
  bookingId: string;
  ownerUid: string;
  contactId: string;
  presentationSlug: string;
  leadName: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
}): Promise<{
  notification: "created" | "exists";
  bookingActivity: "created" | "exists";
  meetingActivity: "created" | "exists";
  metrics: "incremented" | "skipped";
}> {
  const db = getDefaultFirestore();
  const bookingId = input.bookingId;
  const leadName = input.leadName.trim() || "Lead";

  const notification = await createNotificationOnce({
    dedupeKey: buildNotificationDedupeKey([
      "public_booking_created",
      bookingId,
      input.ownerUid,
    ]),
    recipientUid: input.ownerUid,
    title: "Nueva reserva",
    message: `${leadName} · ${input.dateLabel} · ${input.timeLabel}`,
    meetingId: bookingId,
    contactId: input.contactId,
    leadName,
    dateLabel: input.dateLabel,
    timeLabel: input.timeLabel,
    durationMinutes: input.durationMinutes,
    actionUrl: agendaActionUrl(bookingId),
    actionLabel: "Ver cita",
  });

  const bookingActivityRef = db
    .collection(COLLECTIONS.leadActivities)
    .doc(`pb_booking_created_${bookingId}`);
  let bookingActivity: "created" | "exists" = "exists";
  try {
    await bookingActivityRef.create({
      prospectId: input.contactId,
      leaderId: input.ownerUid,
      type: "meeting",
      description: `Reserva pública confirmada (${input.dateLabel} ${input.timeLabel})`,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "system",
      eventKind: "booking_created",
      meetingId: bookingId,
      bookingId,
      presentationSlug: input.presentationSlug,
      source: "presentation_booking",
      actor: "system",
    });
    bookingActivity = "created";
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error ?
        Number((error as {code?: number}).code) :
        0;
    if (code !== 6) throw error;
  }

  const meetingActivityRef = db
    .collection(COLLECTIONS.leadActivities)
    .doc(`pb_meeting_scheduled_${bookingId}`);
  let meetingActivity: "created" | "exists" = "exists";
  try {
    await meetingActivityRef.create({
      prospectId: input.contactId,
      leaderId: input.ownerUid,
      type: "meeting",
      description: `Reunión agendada desde presentación (${input.dateLabel} ${input.timeLabel})`,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "system",
      eventKind: "meeting_scheduled",
      meetingId: bookingId,
      bookingId,
      presentationSlug: input.presentationSlug,
      source: "presentation_booking",
      actor: "system",
    });
    meetingActivity = "created";
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error ?
        Number((error as {code?: number}).code) :
        0;
    if (code !== 6) throw error;
  }

  // Contact touch — never overwrite valid name/status/source.
  const contactRef = db.collection(COLLECTIONS.prospects).doc(input.contactId);
  await contactRef.set(
    {
      updatedAt: FieldValue.serverTimestamp(),
      lastInteractionAt: FieldValue.serverTimestamp(),
      presentationSlug: input.presentationSlug,
    },
    {merge: true},
  );

  const analyticsRef = db
    .collection(COLLECTIONS.presentationFunnelEvents)
    .doc(`booking_completed_${bookingId}`);
  const landingRef = db.collection(COLLECTIONS.leaderLandingPages).doc(input.ownerUid);
  const metricsState = {value: "skipped" as "incremented" | "skipped"};

  await db.runTransaction(async (tx) => {
    const analyticsSnap = await tx.get(analyticsRef);
    if (analyticsSnap.exists) {
      metricsState.value = "skipped";
      return;
    }
    tx.create(analyticsRef, {
      eventKind: "booking_completed",
      presentationSlug: input.presentationSlug,
      ownerUid: input.ownerUid,
      bookingId,
      source: "presentation_booking",
      bookingDuration: input.durationMinutes,
      createdAt: FieldValue.serverTimestamp(),
    });
    // Use update() so dotted paths nest under bookingFunnel (set+merge stores literal keys).
    tx.update(landingRef, {
      "bookingFunnel.bookings": FieldValue.increment(1),
      "bookingFunnel.updatedAt": FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    metricsState.value = "incremented";
  });

  // bookingCount on contact once (same analytics gate)
  if (metricsState.value === "incremented") {
    await contactRef.set(
      {
        bookingCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
  }

  return {
    notification,
    bookingActivity,
    meetingActivity,
    metrics: metricsState.value,
  };
}

export async function recordPresentationFunnelEvent(input: {
  eventKind: PresentationFunnelEventKind;
  presentationSlug: string;
  ownerUid: string;
  clientEventId?: string | null;
  source?: string;
  bookingDuration?: number;
}): Promise<{recorded: boolean; duplicate: boolean}> {
  if (input.eventKind === "booking_completed") {
    throw new HttpsError(
      "invalid-argument",
      "booking_completed solo se registra desde el backend de reserva.",
    );
  }

  const db = getDefaultFirestore();
  const counterField = funnelCounterField(input.eventKind);
  const eventId = input.clientEventId?.trim() ?
    `${input.eventKind}_${input.presentationSlug}_${input.clientEventId.trim()}`.slice(0, 180) :
    null;

  if (eventId) {
    const eventRef = db.collection(COLLECTIONS.presentationFunnelEvents).doc(eventId);
    try {
      await eventRef.create({
        eventKind: input.eventKind,
        presentationSlug: input.presentationSlug,
        ownerUid: input.ownerUid,
        source: input.source || "presentation",
        bookingDuration:
          typeof input.bookingDuration === "number" ? input.bookingDuration : null,
        clientEventId: input.clientEventId,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error ?
          Number((error as {code?: number}).code) :
          0;
      if (code === 6) {
        return {recorded: false, duplicate: true};
      }
      throw error;
    }
  } else {
    await db.collection(COLLECTIONS.presentationFunnelEvents).add({
      eventKind: input.eventKind,
      presentationSlug: input.presentationSlug,
      ownerUid: input.ownerUid,
      source: input.source || "presentation",
      bookingDuration:
        typeof input.bookingDuration === "number" ? input.bookingDuration : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  if (counterField) {
    // Use update() so dotted paths nest under bookingFunnel (set+merge stores literal keys).
    await db
      .collection(COLLECTIONS.leaderLandingPages)
      .doc(input.ownerUid)
      .update({
        [`bookingFunnel.${counterField}`]: FieldValue.increment(1),
        "bookingFunnel.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  return {recorded: true, duplicate: false};
}
