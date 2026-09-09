import {onCall, HttpsError} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {isActiveTeamMemberRecord, type TeamMemberRecord} from "./groupMembershipLogic.js";
import {
  buildTeamAgendaSlotsForMember,
  canUserViewTeamAgenda,
  mergeTeamAgendaSlots,
  parseTeamAgendaRangeInput,
  resolveTeamAgendaMemberUids,
  type TeamAgendaMeetingDoc,
  type TeamAgendaSlotDto,
} from "./teamAgendaLogic.js";

type GetTeamAgendaRequest = {
  teamId?: string;
  rangeStartIso?: string;
  rangeEndIso?: string;
  memberUid?: string | null;
};

type TeamAgendaMemberDto = {
  uid: string;
  name: string;
};

type GetTeamAgendaResponse = {
  teamId: string;
  rangeStartIso: string;
  rangeEndIso: string;
  members: TeamAgendaMemberDto[];
  slots: TeamAgendaSlotDto[];
};

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (
    value &&
    typeof value === "object" &&
    typeof (value as {toMillis?: unknown}).toMillis === "function"
  ) {
    return (value as {toMillis: () => number}).toMillis();
  }
  return 0;
}

async function loadTeamOrThrow(teamId: string) {
  const snapshot = await getDefaultFirestore().collection(COLLECTIONS.teams).doc(teamId).get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "No encontramos el equipo solicitado.");
  }

  const data = snapshot.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid.trim() : "";
  if (!ownerUid) {
    throw new HttpsError("failed-precondition", "El equipo no tiene propietario válido.");
  }

  return {id: snapshot.id, ownerUid};
}

async function loadActiveTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const snapshot = await getDefaultFirestore()
    .collection(COLLECTIONS.teamMembers)
    .where("teamId", "==", teamId)
    .get();

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        memberUid: typeof data.memberUid === "string" ? data.memberUid : "",
        role: typeof data.role === "string" ? data.role : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        memberName: typeof data.memberName === "string" ? data.memberName : undefined,
      } as TeamMemberRecord;
    })
    .filter(isActiveTeamMemberRecord);
}

function mapMeetingDoc(
  id: string,
  data: Record<string, unknown>,
): TeamAgendaMeetingDoc | null {
  const startAtMs = toMillis(data.startAt);
  const endAtMs = toMillis(data.endAt) || startAtMs;
  if (!startAtMs) return null;

  const participantUserIds = Array.isArray(data.participantUserIds) ?
    data.participantUserIds.filter((uid): uid is string => typeof uid === "string") :
    [];

  return {
    id,
    organizerId: typeof data.organizerId === "string" ? data.organizerId : undefined,
    participantUserIds,
    startAtMs,
    endAtMs,
    status: typeof data.status === "string" ? data.status : undefined,
    meetingMode: typeof data.meetingMode === "string" ? data.meetingMode : undefined,
  };
}

async function loadMeetingsForMemberInRange(options: {
  memberUid: string;
  rangeStartMs: number;
  rangeEndMs: number;
}): Promise<TeamAgendaMeetingDoc[]> {
  const db = getDefaultFirestore();
  const startTs = Timestamp.fromMillis(options.rangeStartMs);
  const endTs = Timestamp.fromMillis(options.rangeEndMs);

  const [organizedSnap, invitedSnap] = await Promise.all([
    db
      .collection(COLLECTIONS.meetings)
      .where("organizerId", "==", options.memberUid)
      .where("startAt", ">=", startTs)
      .where("startAt", "<=", endTs)
      .orderBy("startAt", "asc")
      .get(),
    db
      .collection(COLLECTIONS.meetings)
      .where("participantUserIds", "array-contains", options.memberUid)
      .where("startAt", ">=", startTs)
      .where("startAt", "<=", endTs)
      .orderBy("startAt", "asc")
      .get(),
  ]);

  const byId = new Map<string, TeamAgendaMeetingDoc>();
  for (const snap of [...organizedSnap.docs, ...invitedSnap.docs]) {
    const mapped = mapMeetingDoc(snap.id, (snap.data() || {}) as Record<string, unknown>);
    if (mapped) byId.set(mapped.id, mapped);
  }
  return [...byId.values()];
}

export const getTeamAgenda = onCall(
  callableOptions,
  async (request): Promise<GetTeamAgendaResponse> => {
    const uid = requireAuthUid(request);
    const data = (request.data || {}) as GetTeamAgendaRequest;
    const teamId = typeof data.teamId === "string" ? data.teamId.trim() : "";

    if (!teamId) {
      throw new HttpsError("invalid-argument", "Falta teamId.");
    }

    let range: {rangeStartMs: number; rangeEndMs: number};
    try {
      range = parseTeamAgendaRangeInput({
        rangeStartIso: data.rangeStartIso,
        rangeEndIso: data.rangeEndIso,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "RANGE_TOO_LARGE") {
        throw new HttpsError(
          "invalid-argument",
          "El período seleccionado es demasiado amplio. Selecciona otro período.",
        );
      }
      throw new HttpsError("invalid-argument", "Selecciona otro período.");
    }

    const team = await loadTeamOrThrow(teamId);
    if (!canUserViewTeamAgenda({uid, teamOwnerUid: team.ownerUid})) {
      throw new HttpsError(
        "permission-denied",
        "No tienes permiso para ver esta agenda.",
      );
    }

    const activeMembers = await loadActiveTeamMembers(teamId);
    const memberNameByUid = new Map<string, string>();
    for (const member of activeMembers) {
      const memberUid = member.memberUid.trim();
      memberNameByUid.set(
        memberUid,
        member.memberName?.trim() || "Miembro",
      );
    }

    let targetMemberUids: string[];
    try {
      targetMemberUids = resolveTeamAgendaMemberUids({
        activeMemberUids: activeMembers.map((member) => member.memberUid),
        memberUid: data.memberUid,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "FOREIGN_MEMBER") {
        throw new HttpsError(
          "permission-denied",
          "No tienes permiso para ver esta agenda.",
        );
      }
      throw new HttpsError("invalid-argument", "Miembro no válido.");
    }

    const slotGroups: TeamAgendaSlotDto[][] = [];
    for (const memberUid of targetMemberUids) {
      const meetings = await loadMeetingsForMemberInRange({
        memberUid,
        rangeStartMs: range.rangeStartMs,
        rangeEndMs: range.rangeEndMs,
      });
      slotGroups.push(
        buildTeamAgendaSlotsForMember({
          memberUid,
          meetings,
          rangeStartMs: range.rangeStartMs,
          rangeEndMs: range.rangeEndMs,
        }),
      );
    }

    return {
      teamId,
      rangeStartIso: new Date(range.rangeStartMs).toISOString(),
      rangeEndIso: new Date(range.rangeEndMs).toISOString(),
      members: targetMemberUids.map((memberUid) => ({
        uid: memberUid,
        name: memberNameByUid.get(memberUid) || "Miembro",
      })),
      slots: mergeTeamAgendaSlots(slotGroups),
    };
  },
);
