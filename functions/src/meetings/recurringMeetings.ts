import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import {
  cancelCalendarEventForUid,
  createCalendarEventForUid,
  updateCalendarEventForUid,
} from "../calendar/googleCalendar.js";
import {requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {
  canUserManageTeamMeetings,
  resolveAuthorizedGroupParticipants,
  type TeamMemberRecord,
} from "./groupMembershipLogic.js";
import {
  applyStartDelta,
  assertCanModifySeries,
  assertValidClientRequestId,
  buildOccurrenceMeetingId,
  expandRecurrenceStarts,
  filterEditableSeriesOccurrences,
  isTerminalSeriesStatus,
  type RecurrenceEditScope,
  type RecurrenceEndMode,
  type RecurrenceFrequency,
} from "./recurrenceLogic.js";

const googleOAuthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOAuthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const googleOAuthRedirectUri = defineSecret("GOOGLE_OAUTH_REDIRECT_URI");
const appBaseUrl = defineSecret("APP_BASE_URL");

const recurringSecrets = [
  googleOAuthClientId,
  googleOAuthClientSecret,
  googleOAuthRedirectUri,
  appBaseUrl,
];

type MemberSelectionMode = "all" | "partial";

type CreateRecurringMeetingPayload = {
  clientRequestId?: string;
  title?: string;
  type?: string;
  description?: string;
  notes?: string;
  startAtIso?: string;
  durationMinutes?: number;
  timezone?: string;
  contactId?: string | null;
  meetingAudience?: "individual" | "group";
  groupId?: string | null;
  memberSelectionMode?: MemberSelectionMode;
  selectedUserIds?: string[];
  participants?: Array<{
    type?: string;
    userId?: string;
    contactId?: string;
    name?: string;
    email?: string;
  }>;
  meetingMode?: "video" | "in_person" | "other";
  videoProvider?: "manual" | "google_meet" | "none";
  meetingUrl?: string | null;
  location?: string | null;
  organizerName?: string;
  frequency?: RecurrenceFrequency;
  endMode?: RecurrenceEndMode;
  count?: number;
  untilAtIso?: string;
};

type EditRecurringPayload = {
  meetingId?: string;
  scope?: RecurrenceEditScope;
  title?: string;
  type?: string;
  description?: string;
  notes?: string;
  startAtIso?: string;
  durationMinutes?: number;
  timezone?: string;
  meetingMode?: "video" | "in_person" | "other";
  videoProvider?: "manual" | "google_meet" | "none";
  meetingUrl?: string | null;
  location?: string | null;
  syncGoogle?: boolean;
};

type CancelRecurringPayload = {
  meetingId?: string;
  scope?: RecurrenceEditScope;
  cancelReason?: string;
};

function mapHttps(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  if (message === "MAX_OCCURRENCES_EXCEEDED") {
    throw new HttpsError("invalid-argument", "La serie no puede superar 52 reuniones.");
  }
  if (
    message === "INVALID_COUNT" ||
    message === "INVALID_UNTIL" ||
    message === "INVALID_FREQUENCY" ||
    message === "INVALID_END_MODE" ||
    message === "INVALID_SERIES_START" ||
    message === "EMPTY_SERIES" ||
    message === "INVALID_CLIENT_REQUEST_ID"
  ) {
    throw new HttpsError("invalid-argument", "Datos de recurrencia no válidos.");
  }
  if (message === "PERMISSION_DENIED") {
    throw new HttpsError("permission-denied", "No tienes permiso para modificar esta serie.");
  }
  if (message.startsWith("FOREIGN_UID:")) {
    throw new HttpsError(
      "permission-denied",
      "Uno o más participantes no pertenecen al grupo seleccionado.",
    );
  }
  throw new HttpsError("failed-precondition", "No se pudo procesar la serie recurrente.");
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value === "object" && typeof (value as {toMillis?: unknown}).toMillis === "function") {
    return (value as {toMillis: () => number}).toMillis();
  }
  return 0;
}

async function loadActiveTeamMembers(groupId: string): Promise<TeamMemberRecord[]> {
  const snapshot = await getDefaultFirestore()
    .collection(COLLECTIONS.teamMembers)
    .where("teamId", "==", groupId)
    .get();

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() || {};
    return {
      memberUid: typeof data.memberUid === "string" ? data.memberUid : "",
      role: typeof data.role === "string" ? data.role : undefined,
      status: typeof data.status === "string" ? data.status : undefined,
      memberName: typeof data.memberName === "string" ? data.memberName : undefined,
      memberEmail: typeof data.memberEmail === "string" ? data.memberEmail : undefined,
    };
  });
}

async function assertCanManageGroup(uid: string, groupId: string) {
  const teamSnap = await getDefaultFirestore().collection(COLLECTIONS.teams).doc(groupId).get();
  if (!teamSnap.exists) {
    throw new HttpsError("not-found", "No encontramos el grupo solicitado.");
  }
  const data = teamSnap.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "Grupo";
  const membershipSnap = await getDefaultFirestore()
    .collection(COLLECTIONS.teamMembers)
    .doc(`${groupId}_${uid}`)
    .get();
  const membership = membershipSnap.exists
    ? ({
      memberUid: membershipSnap.data()?.memberUid,
      role: membershipSnap.data()?.role,
      status: membershipSnap.data()?.status,
    } as TeamMemberRecord)
    : null;

  if (!canUserManageTeamMeetings({uid, teamOwnerUid: ownerUid, membership})) {
    throw new HttpsError("permission-denied", "No tienes permiso para agendar este grupo.");
  }
  return {id: teamSnap.id, ownerUid, name};
}

async function loadSeriesMeetings(seriesId: string) {
  const snap = await getDefaultFirestore()
    .collection(COLLECTIONS.meetings)
    .where("recurrenceSeriesId", "==", seriesId)
    .get();

  return snap.docs.map((docSnap) => {
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      ref: docSnap.ref,
      data,
      recurrenceIndex:
        typeof data.recurrenceIndex === "number" ? data.recurrenceIndex : -1,
      status: typeof data.status === "string" ? data.status : "",
      startAtMs: toMillis(data.startAt),
      endAtMs: toMillis(data.endAt),
      googleCalendarEventId:
        typeof data.googleCalendarEventId === "string" ? data.googleCalendarEventId : null,
      organizerId: typeof data.organizerId === "string" ? data.organizerId : "",
    };
  });
}

export const createRecurringMeeting = onCall(
  {
    ...callableOptions,
    secrets: recurringSecrets,
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = (request.data || {}) as CreateRecurringMeetingPayload;

    let seriesId: string;
    try {
      seriesId = assertValidClientRequestId(data.clientRequestId || "");
    } catch (error) {
      mapHttps(error);
    }

    const title = data.title?.trim() || "";
    if (!title) {
      throw new HttpsError("invalid-argument", "El título es obligatorio.");
    }

    const durationMinutes = Number(data.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
      throw new HttpsError("invalid-argument", "La duración debe estar entre 5 y 480 minutos.");
    }

    const timezone = data.timezone?.trim() || "";
    if (!timezone) {
      throw new HttpsError("invalid-argument", "Falta la zona horaria.");
    }

    const seriesStartAt = data.startAtIso ? new Date(data.startAtIso) : new Date(NaN);
    if (Number.isNaN(seriesStartAt.getTime())) {
      throw new HttpsError("invalid-argument", "Fecha de inicio no válida.");
    }

    const frequency = data.frequency;
    const endMode = data.endMode;
    if (frequency !== "weekly" && frequency !== "biweekly" && frequency !== "monthly") {
      throw new HttpsError("invalid-argument", "Frecuencia de recurrencia no válida.");
    }
    if (endMode !== "count" && endMode !== "until") {
      throw new HttpsError("invalid-argument", "Modo de finalización no válido.");
    }

    let starts;
    try {
      starts = expandRecurrenceStarts({
        frequency,
        seriesStartAtMs: seriesStartAt.getTime(),
        endMode,
        count: data.count,
        untilAtMs: data.untilAtIso ? Date.parse(data.untilAtIso) : undefined,
      });
    } catch (error) {
      mapHttps(error);
    }

    const db = getDefaultFirestore();
    const seriesRef = db.collection(COLLECTIONS.meetingSeries).doc(seriesId);
    const existingSeries = await seriesRef.get();
    if (existingSeries.exists && existingSeries.data()?.status === "ready") {
      const meetingIds = Array.isArray(existingSeries.data()?.meetingIds) ?
        existingSeries.data()!.meetingIds :
        [];
      return {
        seriesId,
        meetingIds,
        occurrenceCount: meetingIds.length,
        idempotent: true,
      };
    }

    const audience = data.meetingAudience === "group" ? "group" : "individual";
    let groupId: string | null = null;
    let groupNameSnapshot: string | null = null;
    let participants: Array<Record<string, unknown>> = [];
    let participantUserIds: string[] = [];
    let attendeeEmails: string[] = [];

    if (audience === "group") {
      const gid = data.groupId?.trim() || "";
      if (!gid) {
        throw new HttpsError("invalid-argument", "Falta el grupo.");
      }
      const team = await assertCanManageGroup(uid, gid);
      groupId = team.id;
      groupNameSnapshot = team.name;
      const members = await loadActiveTeamMembers(gid);
      const mode: MemberSelectionMode =
        data.memberSelectionMode === "partial" ? "partial" : "all";
      try {
        const resolved = resolveAuthorizedGroupParticipants({
          organizerId: uid,
          members,
          mode,
          selectedUserIds: data.selectedUserIds,
        });
        participantUserIds = resolved.participantUserIds;
        attendeeEmails = resolved.attendeeEmails;
        participants = resolved.participants.map((participant) => {
          const base = {
            type: "user" as const,
            userId: participant.userId,
            name: participant.name,
          };
          return participant.email ? {...base, email: participant.email} : base;
        });
      } catch (error) {
        mapHttps(error);
      }
    } else {
      participants = Array.isArray(data.participants) ?
        data.participants
          .filter((p) => p && typeof p.name === "string" && p.name.trim())
          .map((p) => ({
            type: p.type || "contact",
            userId: p.userId,
            contactId: p.contactId,
            name: String(p.name).trim(),
            email: p.email,
          })) :
        [];
      participantUserIds = participants
        .map((p) => (typeof p.userId === "string" ? p.userId.trim() : ""))
        .filter(Boolean)
        .filter((id) => id !== uid);
    }

    const meetingMode = data.meetingMode || "other";
    const videoProvider = data.videoProvider || "none";
    const meetingUrl = data.meetingUrl ?? null;
    const meetingProvider: "google_meet" | "none" =
      videoProvider === "google_meet" ? "google_meet" : "none";
    const useGoogleMeet = meetingMode === "video" && videoProvider === "google_meet";

    await seriesRef.set(
      {
        organizerId: uid,
        clientRequestId: seriesId,
        frequency,
        endMode,
        count: endMode === "count" ? Number(data.count) : null,
        untilAt: endMode === "until" && data.untilAtIso ?
          Timestamp.fromDate(new Date(data.untilAtIso)) :
          null,
        seriesStartAt: Timestamp.fromDate(seriesStartAt),
        occurrenceCount: starts.length,
        meetingIds: starts.map((item) => buildOccurrenceMeetingId(seriesId, item.index)),
        status: "creating",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    const meetingIds: string[] = [];
    let sharedMeetUrl: string | null = null;

    for (const occurrence of starts) {
      const meetingId = buildOccurrenceMeetingId(seriesId, occurrence.index);
      meetingIds.push(meetingId);
      const meetingRef = db.collection(COLLECTIONS.meetings).doc(meetingId);
      const existing = await meetingRef.get();
      if (existing.exists) {
        continue;
      }

      const startAt = new Date(occurrence.startAtMs);
      const endAt = new Date(occurrence.startAtMs + durationMinutes * 60_000);
      let googleCalendarEventId: string | null = null;
      let googleCalendarHtmlLink: string | null = null;
      let googleMeetUrl: string | null = null;
      let occurrenceMeetingUrl = meetingUrl;
      let occurrenceVideoProvider = videoProvider;
      let occurrenceMeetingProvider = meetingProvider;

      if (useGoogleMeet) {
        const googleResult = await createCalendarEventForUid(uid, {
          title,
          description: data.description?.trim() || "",
          startAtIso: startAt.toISOString(),
          endAtIso: endAt.toISOString(),
          timezone,
          attendeeEmails,
        });
        googleCalendarEventId = googleResult.googleCalendarEventId;
        googleCalendarHtmlLink = googleResult.googleCalendarHtmlLink;
        googleMeetUrl = googleResult.googleMeetUrl;
        occurrenceMeetingUrl = googleMeetUrl;
        occurrenceVideoProvider = googleMeetUrl ? "google_meet" : "none";
        occurrenceMeetingProvider = googleMeetUrl ? "google_meet" : "none";
        if (!sharedMeetUrl && googleMeetUrl) {
          sharedMeetUrl = googleMeetUrl;
        }
      }

      await meetingRef.set({
        title,
        type: audience === "group" ? "group" : data.type || "follow_up",
        description: data.description?.trim() || "",
        notes: data.notes?.trim() || "",
        resultNotes: "",
        status: "scheduled",
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        durationMinutes,
        timezone,
        organizerId: uid,
        organizerName: data.organizerName?.trim() || "Usuario EXPANSIÓN",
        contactId: audience === "individual" ? data.contactId ?? null : null,
        meetingAudience: audience,
        groupId,
        groupNameSnapshot,
        participants,
        participantUserIds,
        meetingMode,
        videoProvider: occurrenceVideoProvider,
        meetingUrl: occurrenceMeetingUrl,
        location: meetingMode === "in_person" ? data.location ?? null : null,
        meetingProvider: occurrenceMeetingProvider,
        googleCalendarEventId,
        googleCalendarHtmlLink,
        googleMeetUrl,
        recurrenceSeriesId: seriesId,
        recurrenceIndex: occurrence.index,
        recurrenceFrequency: frequency,
        seriesStartAt: Timestamp.fromDate(seriesStartAt),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        updatedBy: uid,
        completedAt: null,
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        resultRecordedBy: null,
        resultRecordedAt: null,
      });

      await meetingRef.collection("history").add({
        type: "created",
        changedBy: uid,
        changedAt: FieldValue.serverTimestamp(),
        newStartAt: Timestamp.fromDate(startAt),
        newEndAt: Timestamp.fromDate(endAt),
      });
    }

    await seriesRef.set(
      {
        status: "ready",
        meetingIds,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    return {
      seriesId,
      meetingIds,
      occurrenceCount: meetingIds.length,
      idempotent: false,
      firstMeetingId: meetingIds[0] || null,
    };
  },
);

export const editRecurringMeetingScope = onCall(
  {
    ...callableOptions,
    secrets: recurringSecrets,
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = (request.data || {}) as EditRecurringPayload;
    const meetingId = data.meetingId?.trim() || "";
    const scope: RecurrenceEditScope =
      data.scope === "this_and_future" ? "this_and_future" : "this";

    if (!meetingId) {
      throw new HttpsError("invalid-argument", "Falta meetingId.");
    }

    const db = getDefaultFirestore();
    const anchorRef = db.collection(COLLECTIONS.meetings).doc(meetingId);
    const anchorSnap = await anchorRef.get();
    if (!anchorSnap.exists) {
      throw new HttpsError("not-found", "No encontramos la reunión.");
    }
    const anchor = anchorSnap.data() || {};
    const seriesId =
      typeof anchor.recurrenceSeriesId === "string" ? anchor.recurrenceSeriesId.trim() : "";
    const fromIndex =
      typeof anchor.recurrenceIndex === "number" ? anchor.recurrenceIndex : -1;

    if (!seriesId || fromIndex < 0) {
      throw new HttpsError("failed-precondition", "Esta reunión no pertenece a una serie.");
    }

    try {
      assertCanModifySeries({
        uid,
        organizerId: typeof anchor.organizerId === "string" ? anchor.organizerId : "",
      });
    } catch (error) {
      mapHttps(error);
    }

    if (isTerminalSeriesStatus(typeof anchor.status === "string" ? anchor.status : "")) {
      throw new HttpsError(
        "failed-precondition",
        "No se puede editar una reunión finalizada o cancelada.",
      );
    }

    const durationMinutes = Number(data.durationMinutes ?? anchor.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
      throw new HttpsError("invalid-argument", "Duración no válida.");
    }

    const nextStartAt = data.startAtIso ? new Date(data.startAtIso) : null;
    if (data.startAtIso && (!nextStartAt || Number.isNaN(nextStartAt.getTime()))) {
      throw new HttpsError("invalid-argument", "Fecha de inicio no válida.");
    }

    const previousStartAtMs = toMillis(anchor.startAt);
    const nextStartAtMs = nextStartAt ? nextStartAt.getTime() : previousStartAtMs;
    const timezone =
      (typeof data.timezone === "string" && data.timezone.trim()) ||
      (typeof anchor.timezone === "string" ? anchor.timezone : "UTC");
    const title =
      (typeof data.title === "string" && data.title.trim()) ||
      (typeof anchor.title === "string" ? anchor.title : "Reunión");
    const description =
      typeof data.description === "string" ?
        data.description.trim() :
        typeof anchor.description === "string" ? anchor.description : "";
    const notes =
      typeof data.notes === "string" ?
        data.notes.trim() :
        typeof anchor.notes === "string" ? anchor.notes : "";
    const meetingMode = data.meetingMode || anchor.meetingMode || "other";
    const videoProvider = data.videoProvider || anchor.videoProvider || "none";
    const meetingUrl =
      data.meetingUrl !== undefined ? data.meetingUrl : anchor.meetingUrl ?? null;
    const location =
      meetingMode === "in_person" ?
        data.location !== undefined ? data.location : anchor.location ?? null :
        null;
    const syncGoogle = data.syncGoogle !== false;

    const seriesMeetings = await loadSeriesMeetings(seriesId);
    const targets = filterEditableSeriesOccurrences({
      occurrences: seriesMeetings,
      fromIndex,
      scope,
    });

    if (targets.length === 0) {
      throw new HttpsError("failed-precondition", "No hay ocurrencias editables en el alcance.");
    }

    const updatedIds: string[] = [];
    for (const target of targets) {
      if (isTerminalSeriesStatus(target.status)) {
        continue;
      }
      const startAtMs =
        scope === "this" || target.recurrenceIndex === fromIndex ?
          nextStartAtMs :
          applyStartDelta({
            previousStartAtMs,
            nextStartAtMs,
            targetStartAtMs: target.startAtMs,
          });
      const endAtMs = startAtMs + durationMinutes * 60_000;
      const patch: Record<string, unknown> = {
        title,
        description,
        notes,
        startAt: Timestamp.fromMillis(startAtMs),
        endAt: Timestamp.fromMillis(endAtMs),
        durationMinutes,
        timezone,
        meetingMode,
        videoProvider,
        meetingUrl,
        location,
        status: "scheduled",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      };
      if (typeof data.type === "string" && data.type.trim()) {
        patch.type = data.type.trim();
      }

      if (
        syncGoogle &&
        target.googleCalendarEventId &&
        meetingMode === "video" &&
        videoProvider === "google_meet"
      ) {
        await updateCalendarEventForUid(uid, {
          googleCalendarEventId: target.googleCalendarEventId,
          title,
          description,
          startAtIso: new Date(startAtMs).toISOString(),
          endAtIso: new Date(endAtMs).toISOString(),
          timezone,
          attendeeEmails: [],
        });
      }

      await target.ref.update(patch);
      await target.ref.collection("history").add({
        type: "rescheduled",
        changedBy: uid,
        changedAt: FieldValue.serverTimestamp(),
        previousStartAt: Timestamp.fromMillis(target.startAtMs),
        previousEndAt: Timestamp.fromMillis(target.endAtMs || target.startAtMs),
        newStartAt: Timestamp.fromMillis(startAtMs),
        newEndAt: Timestamp.fromMillis(endAtMs),
      });
      updatedIds.push(target.id);
    }

    return {seriesId, scope, updatedMeetingIds: updatedIds};
  },
);

export const cancelRecurringMeetingScope = onCall(
  {
    ...callableOptions,
    secrets: recurringSecrets,
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = (request.data || {}) as CancelRecurringPayload;
    const meetingId = data.meetingId?.trim() || "";
    const scope: RecurrenceEditScope =
      data.scope === "this_and_future" ? "this_and_future" : "this";
    const cancelReason = data.cancelReason?.trim() || "Serie cancelada";

    if (!meetingId) {
      throw new HttpsError("invalid-argument", "Falta meetingId.");
    }

    const db = getDefaultFirestore();
    const anchorRef = db.collection(COLLECTIONS.meetings).doc(meetingId);
    const anchorSnap = await anchorRef.get();
    if (!anchorSnap.exists) {
      throw new HttpsError("not-found", "No encontramos la reunión.");
    }
    const anchor = anchorSnap.data() || {};
    const seriesId =
      typeof anchor.recurrenceSeriesId === "string" ? anchor.recurrenceSeriesId.trim() : "";
    const fromIndex =
      typeof anchor.recurrenceIndex === "number" ? anchor.recurrenceIndex : -1;

    if (!seriesId || fromIndex < 0) {
      throw new HttpsError("failed-precondition", "Esta reunión no pertenece a una serie.");
    }

    try {
      assertCanModifySeries({
        uid,
        organizerId: typeof anchor.organizerId === "string" ? anchor.organizerId : "",
      });
    } catch (error) {
      mapHttps(error);
    }

    const seriesMeetings = await loadSeriesMeetings(seriesId);
    const targets = filterEditableSeriesOccurrences({
      occurrences: seriesMeetings,
      fromIndex,
      scope,
    });

    const cancelledIds: string[] = [];
    for (const target of targets) {
      if (isTerminalSeriesStatus(target.status)) continue;

      if (target.googleCalendarEventId) {
        try {
          await cancelCalendarEventForUid(uid, target.googleCalendarEventId);
        } catch {
          // Keep Firestore cancel authoritative if Google delete fails.
        }
      }

      await target.ref.update({
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: uid,
        cancelReason,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      });
      await target.ref.collection("history").add({
        type: "cancelled",
        changedBy: uid,
        changedAt: FieldValue.serverTimestamp(),
        reason: cancelReason,
      });
      cancelledIds.push(target.id);
    }

    return {seriesId, scope, cancelledMeetingIds: cancelledIds};
  },
);
