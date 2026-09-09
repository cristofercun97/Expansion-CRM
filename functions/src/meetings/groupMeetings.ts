import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import {
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

const googleOAuthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOAuthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const googleOAuthRedirectUri = defineSecret("GOOGLE_OAUTH_REDIRECT_URI");
const appBaseUrl = defineSecret("APP_BASE_URL");

const groupMeetingSecrets = [
  googleOAuthClientId,
  googleOAuthClientSecret,
  googleOAuthRedirectUri,
  appBaseUrl,
];

type MemberSelectionMode = "all" | "partial";

type GroupMeetingPayload = {
  title?: string;
  type?: string;
  description?: string;
  notes?: string;
  startAtIso?: string;
  durationMinutes?: number;
  timezone?: string;
  groupId?: string;
  memberSelectionMode?: MemberSelectionMode;
  selectedUserIds?: string[];
  meetingMode?: "video" | "in_person" | "other";
  videoProvider?: "manual" | "google_meet" | "none";
  meetingUrl?: string | null;
  location?: string | null;
  organizerName?: string;
};

async function loadTeamOrThrow(groupId: string) {
  const snapshot = await getDefaultFirestore().collection(COLLECTIONS.teams).doc(groupId).get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "No encontramos el grupo solicitado.");
  }

  const data = snapshot.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid.trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (!ownerUid) {
    throw new HttpsError("failed-precondition", "El grupo no tiene propietario válido.");
  }

  return {
    id: snapshot.id,
    ownerUid,
    name: name || "Grupo",
  };
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

async function assertCanManageGroupMeetings(uid: string, groupId: string) {
  const team = await loadTeamOrThrow(groupId);
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

  if (!canUserManageTeamMeetings({
    uid,
    teamOwnerUid: team.ownerUid,
    membership,
  })) {
    throw new HttpsError(
      "permission-denied",
      "No tienes permiso para agendar reuniones para este grupo.",
    );
  }

  return team;
}

function resolveParticipantsOrThrow(options: {
  organizerId: string;
  members: TeamMemberRecord[];
  mode: MemberSelectionMode;
  selectedUserIds?: string[];
}) {
  try {
    return resolveAuthorizedGroupParticipants(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("FOREIGN_UID:")) {
      throw new HttpsError(
        "permission-denied",
        "Uno o más participantes no pertenecen al grupo seleccionado.",
      );
    }
    if (message === "EMPTY_SELECTION" || message === "EMPTY_PARTICIPANTS") {
      throw new HttpsError(
        "failed-precondition",
        "El grupo no tiene miembros disponibles o la selección está vacía.",
      );
    }
    throw new HttpsError("failed-precondition", "No se pudo validar la membresía del grupo.");
  }
}

function parseStartEnd(data: GroupMeetingPayload) {
  if (!data.startAtIso || !data.durationMinutes || !data.timezone?.trim()) {
    throw new HttpsError("invalid-argument", "Faltan fecha, duración o zona horaria.");
  }

  const durationMinutes = Number(data.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
    throw new HttpsError("invalid-argument", "La duración debe estar entre 5 y 480 minutos.");
  }

  const startAt = new Date(data.startAtIso);
  if (Number.isNaN(startAt.getTime())) {
    throw new HttpsError("invalid-argument", "Fecha de inicio no válida.");
  }

  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
  return {startAt, endAt, durationMinutes, timezone: data.timezone.trim()};
}

export const createGroupMeeting = onCall(
  {
    ...callableOptions,
    secrets: groupMeetingSecrets,
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = request.data as GroupMeetingPayload;
    const groupId = data.groupId?.trim();
    const title = data.title?.trim();

    if (!groupId || !title) {
      throw new HttpsError("invalid-argument", "Título y grupo son obligatorios.");
    }

    const mode: MemberSelectionMode = data.memberSelectionMode === "partial" ? "partial" : "all";
    const team = await assertCanManageGroupMeetings(uid, groupId);
    const members = await loadActiveTeamMembers(groupId);
    const resolved = resolveParticipantsOrThrow({
      organizerId: uid,
      members,
      mode,
      selectedUserIds: data.selectedUserIds,
    });

    const {startAt, endAt, durationMinutes, timezone} = parseStartEnd(data);
    const meetingMode = data.meetingMode || "other";
    let videoProvider = data.videoProvider || "none";
    let meetingUrl = data.meetingUrl ?? null;
    let meetingProvider: "google_meet" | "none" = videoProvider === "google_meet" ? "google_meet" : "none";
    let googleCalendarEventId: string | null = null;
    let googleCalendarHtmlLink: string | null = null;
    let googleMeetUrl: string | null = null;

    if (meetingMode === "video" && videoProvider === "google_meet") {
      const googleResult = await createCalendarEventForUid(uid, {
        title,
        description: data.description?.trim() || "",
        startAtIso: startAt.toISOString(),
        endAtIso: endAt.toISOString(),
        timezone,
        attendeeEmails: resolved.attendeeEmails,
      });
      googleCalendarEventId = googleResult.googleCalendarEventId;
      googleCalendarHtmlLink = googleResult.googleCalendarHtmlLink;
      googleMeetUrl = googleResult.googleMeetUrl;
      meetingUrl = googleMeetUrl;
      videoProvider = googleMeetUrl ? "google_meet" : "none";
      meetingProvider = googleMeetUrl ? "google_meet" : "none";
    }

    const participants = resolved.participants.map((participant) => ({
      type: "user" as const,
      userId: participant.userId,
      name: participant.name,
      email: participant.email,
    }));

    const meetingRef = getDefaultFirestore().collection(COLLECTIONS.meetings).doc();
    const payload = {
      title,
      type: "group",
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
      contactId: null,
      meetingAudience: "group",
      groupId: team.id,
      groupNameSnapshot: team.name,
      participants,
      participantUserIds: resolved.participantUserIds,
      meetingMode,
      videoProvider,
      meetingUrl,
      location: meetingMode === "in_person" ? data.location ?? null : null,
      meetingProvider,
      googleCalendarEventId,
      googleCalendarHtmlLink,
      googleMeetUrl,
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
    };

    await meetingRef.set(payload);

    await meetingRef.collection("history").add({
      type: "created",
      changedBy: uid,
      changedAt: FieldValue.serverTimestamp(),
      newStartAt: Timestamp.fromDate(startAt),
      newEndAt: Timestamp.fromDate(endAt),
    });

    return {
      meetingId: meetingRef.id,
      participantUserIds: resolved.participantUserIds,
      groupId: team.id,
      groupNameSnapshot: team.name,
      googleCalendarEventId,
      googleMeetUrl,
    };
  },
);

export const updateGroupMeetingParticipants = onCall(
  {
    ...callableOptions,
    secrets: groupMeetingSecrets,
  },
  async (request) => {
    const uid = requireAuthUid(request);
    const data = request.data as {
      meetingId?: string;
      memberSelectionMode?: MemberSelectionMode;
      selectedUserIds?: string[];
      syncGoogleAttendees?: boolean;
      title?: string;
      description?: string;
      startAtIso?: string;
      endAtIso?: string;
      timezone?: string;
    };

    const meetingId = data.meetingId?.trim();
    if (!meetingId) {
      throw new HttpsError("invalid-argument", "Falta el ID de la reunión.");
    }

    const meetingRef = getDefaultFirestore().collection(COLLECTIONS.meetings).doc(meetingId);
    const meetingSnap = await meetingRef.get();
    if (!meetingSnap.exists) {
      throw new HttpsError("not-found", "No encontramos la reunión.");
    }

    const meeting = meetingSnap.data() || {};
    if (meeting.organizerId !== uid) {
      throw new HttpsError("permission-denied", "Solo el organizador puede modificar participantes.");
    }

    if (meeting.meetingAudience !== "group" || typeof meeting.groupId !== "string") {
      throw new HttpsError("failed-precondition", "La reunión no es una reunión de grupo.");
    }

    const groupId = meeting.groupId.trim();
    await assertCanManageGroupMeetings(uid, groupId);
    const members = await loadActiveTeamMembers(groupId);
    const mode: MemberSelectionMode = data.memberSelectionMode === "partial" ? "partial" : "all";
    const resolved = resolveParticipantsOrThrow({
      organizerId: uid,
      members,
      mode,
      selectedUserIds: data.selectedUserIds,
    });

    const participants = resolved.participants.map((participant) => ({
      type: "user" as const,
      userId: participant.userId,
      name: participant.name,
      email: participant.email,
    }));

    if (
      data.syncGoogleAttendees &&
      typeof meeting.googleCalendarEventId === "string" &&
      meeting.googleCalendarEventId
    ) {
      const startAtIso =
        data.startAtIso ||
        (meeting.startAt?.toDate ? meeting.startAt.toDate().toISOString() : null);
      const endAtIso =
        data.endAtIso ||
        (meeting.endAt?.toDate ? meeting.endAt.toDate().toISOString() : null);
      const timezone =
        data.timezone ||
        (typeof meeting.timezone === "string" ? meeting.timezone : "UTC");

      if (!startAtIso || !endAtIso) {
        throw new HttpsError("failed-precondition", "La reunión no tiene fechas válidas para Calendar.");
      }

      await updateCalendarEventForUid(uid, {
        googleCalendarEventId: meeting.googleCalendarEventId,
        title: data.title?.trim() || meeting.title || "Reunión",
        description: data.description?.trim() || meeting.description || "",
        startAtIso,
        endAtIso,
        timezone,
        attendeeEmails: resolved.attendeeEmails,
      });
    }

    await meetingRef.update({
      participants,
      participantUserIds: resolved.participantUserIds,
      groupId,
      meetingAudience: "group",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    return {
      meetingId,
      participantUserIds: resolved.participantUserIds,
      groupId,
    };
  },
);
