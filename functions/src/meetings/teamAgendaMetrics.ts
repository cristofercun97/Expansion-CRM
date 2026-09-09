import {onCall, HttpsError} from "firebase-functions/v2/https";
import {Timestamp} from "firebase-admin/firestore";
import {requireAuthUid} from "../utils/auth.js";
import {callableOptions} from "../utils/callableOptions.js";
import {COLLECTIONS, getDefaultFirestore} from "../utils/firestore.js";
import {isActiveTeamMemberRecord, type TeamMemberRecord} from "./groupMembershipLogic.js";
import {
  aggregateTeamMemberMetrics,
  assertTeamMetricsDtoSanitized,
  type AgendaTeamMemberMetrics,
} from "./agendaMetricsLogic.js";
import {
  canUserViewTeamAgenda,
  parseTeamAgendaRangeInput,
  resolveTeamAgendaMemberUids,
} from "./teamAgendaLogic.js";

type GetTeamAgendaMetricsRequest = {
  teamId?: string;
  rangeStartIso?: string;
  rangeEndIso?: string;
};

type GetTeamAgendaMetricsResponse = {
  teamId: string;
  rangeStartIso: string;
  rangeEndIso: string;
  members: AgendaTeamMemberMetrics[];
};

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
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

async function loadMemberStatusesInRange(options: {
  memberUid: string;
  rangeStartMs: number;
  rangeEndMs: number;
}): Promise<string[]> {
  const db = getDefaultFirestore();
  const startTs = Timestamp.fromMillis(options.rangeStartMs);
  const endTs = Timestamp.fromMillis(options.rangeEndMs);

  const [organizedSnap, invitedSnap] = await Promise.all([
    db
      .collection(COLLECTIONS.meetings)
      .where("organizerId", "==", options.memberUid)
      .where("startAt", ">=", startTs)
      .where("startAt", "<=", endTs)
      .get(),
    db
      .collection(COLLECTIONS.meetings)
      .where("participantUserIds", "array-contains", options.memberUid)
      .where("startAt", ">=", startTs)
      .where("startAt", "<=", endTs)
      .get(),
  ]);

  const byId = new Map<string, string>();
  for (const snap of [...organizedSnap.docs, ...invitedSnap.docs]) {
    const data = snap.data() || {};
    const startAtMs = toMillis(data.startAt);
    if (startAtMs < options.rangeStartMs || startAtMs > options.rangeEndMs) continue;
    const status = typeof data.status === "string" ? data.status : "scheduled";
    byId.set(snap.id, status);
  }
  return [...byId.values()];
}

export const getTeamAgendaMetrics = onCall(
  callableOptions,
  async (request): Promise<GetTeamAgendaMetricsResponse> => {
    const uid = requireAuthUid(request);
    const data = (request.data || {}) as GetTeamAgendaMetricsRequest;
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
      throw new HttpsError("permission-denied", "No tienes permiso para ver esta agenda.");
    }

    const activeMembers = await loadActiveTeamMembers(teamId);
    const memberUids = resolveTeamAgendaMemberUids({
      activeMemberUids: activeMembers.map((member) => member.memberUid),
    });

    const nameByUid = new Map<string, string>();
    for (const member of activeMembers) {
      nameByUid.set(member.memberUid.trim(), member.memberName?.trim() || "Miembro");
    }

    const members: AgendaTeamMemberMetrics[] = [];
    for (const memberUid of memberUids) {
      const statuses = await loadMemberStatusesInRange({
        memberUid,
        rangeStartMs: range.rangeStartMs,
        rangeEndMs: range.rangeEndMs,
      });
      const row = aggregateTeamMemberMetrics({
        memberUid,
        displayName: nameByUid.get(memberUid) || "Miembro",
        statuses,
      });
      assertTeamMetricsDtoSanitized(row as unknown as Record<string, unknown>);
      members.push(row);
    }

    members.sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));

    return {
      teamId,
      rangeStartIso: new Date(range.rangeStartMs).toISOString(),
      rangeEndIso: new Date(range.rangeEndMs).toISOString(),
      members,
    };
  },
);
