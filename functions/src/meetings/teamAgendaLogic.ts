/**
 * Pure helpers for secure team agenda projection (Fase 3A.1).
 * No Firestore I/O — callers load teams/members/meetings via Admin SDK.
 */

export const TEAM_AGENDA_MAX_RANGE_DAYS = 31;

export const TEAM_AGENDA_FORBIDDEN_FIELDS = [
  "title",
  "description",
  "notes",
  "resultNotes",
  "meetingUrl",
  "googleMeetUrl",
  "googleCalendarEventId",
  "googleCalendarHtmlLink",
  "participants",
  "participantUserIds",
  "emails",
  "attendeeEmails",
  "location",
  "contactId",
  "oauth",
] as const;

export type TeamAgendaMeetingDoc = {
  id: string;
  organizerId?: string;
  participantUserIds?: string[];
  startAtMs: number;
  endAtMs: number;
  status?: string;
  meetingMode?: string;
};

export type TeamAgendaSlotDto = {
  meetingId: string;
  memberUid: string;
  startAt: string;
  endAt: string;
  status: string;
  meetingMode: string;
  busy: boolean;
};

export function canUserViewTeamAgenda(options: {
  uid: string;
  teamOwnerUid: string;
}): boolean {
  const uid = options.uid.trim();
  const owner = options.teamOwnerUid.trim();
  return Boolean(uid) && Boolean(owner) && uid === owner;
}

export function assertTeamAgendaRange(options: {
  rangeStartMs: number;
  rangeEndMs: number;
  maxRangeDays?: number;
}): {rangeStartMs: number; rangeEndMs: number; spanDays: number} {
  const {rangeStartMs, rangeEndMs} = options;
  const maxDays = options.maxRangeDays ?? TEAM_AGENDA_MAX_RANGE_DAYS;

  if (!Number.isFinite(rangeStartMs) || !Number.isFinite(rangeEndMs)) {
    throw new Error("INVALID_RANGE");
  }
  if (rangeEndMs <= rangeStartMs) {
    throw new Error("INVALID_RANGE");
  }

  const spanMs = rangeEndMs - rangeStartMs;
  const spanDays = spanMs / (24 * 60 * 60_000);
  if (spanDays > maxDays + 1e-9) {
    throw new Error("RANGE_TOO_LARGE");
  }

  return {rangeStartMs, rangeEndMs, spanDays};
}

export function parseTeamAgendaRangeInput(options: {
  rangeStartIso?: string;
  rangeEndIso?: string;
}): {rangeStartMs: number; rangeEndMs: number; spanDays: number} {
  const start = options.rangeStartIso?.trim() ? Date.parse(options.rangeStartIso) : NaN;
  const end = options.rangeEndIso?.trim() ? Date.parse(options.rangeEndIso) : NaN;
  return assertTeamAgendaRange({rangeStartMs: start, rangeEndMs: end});
}

export function resolveTeamAgendaMemberUids(options: {
  activeMemberUids: string[];
  memberUid?: string | null;
}): string[] {
  const active = [...new Set(
    options.activeMemberUids.map((uid) => uid.trim()).filter(Boolean),
  )].sort();

  const requested = options.memberUid?.trim() || "";
  if (!requested) {
    return active;
  }

  if (!active.includes(requested)) {
    throw new Error("FOREIGN_MEMBER");
  }

  return [requested];
}

export function isBusyTeamAgendaStatus(status: string): boolean {
  return status === "scheduled" || status === "rescheduled";
}

export function sanitizeTeamAgendaSlot(options: {
  meeting: TeamAgendaMeetingDoc;
  memberUid: string;
}): TeamAgendaSlotDto {
  const status =
    typeof options.meeting.status === "string" && options.meeting.status.trim() ?
      options.meeting.status.trim() :
      "scheduled";
  const meetingMode =
    typeof options.meeting.meetingMode === "string" && options.meeting.meetingMode.trim() ?
      options.meeting.meetingMode.trim() :
      "other";

  return {
    meetingId: options.meeting.id,
    memberUid: options.memberUid.trim(),
    startAt: new Date(options.meeting.startAtMs).toISOString(),
    endAt: new Date(options.meeting.endAtMs).toISOString(),
    status,
    meetingMode,
    busy: isBusyTeamAgendaStatus(status),
  };
}

export function assertSanitizedTeamAgendaSlot(slot: Record<string, unknown>): void {
  for (const key of TEAM_AGENDA_FORBIDDEN_FIELDS) {
    if (key in slot) {
      throw new Error(`PRIVATE_FIELD_LEAK:${key}`);
    }
  }

  const allowed = new Set([
    "meetingId",
    "memberUid",
    "startAt",
    "endAt",
    "status",
    "meetingMode",
    "busy",
  ]);

  for (const key of Object.keys(slot)) {
    if (!allowed.has(key)) {
      throw new Error(`UNEXPECTED_FIELD:${key}`);
    }
  }
}

/**
 * Attribute meetings to a member when they organize or participate.
 * Only meetings intersecting [rangeStartMs, rangeEndMs] by startAt are included
 * (caller must already query by startAt range).
 */
export function buildTeamAgendaSlotsForMember(options: {
  memberUid: string;
  meetings: TeamAgendaMeetingDoc[];
  rangeStartMs: number;
  rangeEndMs: number;
}): TeamAgendaSlotDto[] {
  const memberUid = options.memberUid.trim();
  const slots: TeamAgendaSlotDto[] = [];
  const seen = new Set<string>();

  for (const meeting of options.meetings) {
    if (!meeting.id || seen.has(meeting.id)) continue;

    const isOrganizer = (meeting.organizerId || "").trim() === memberUid;
    const isParticipant = (meeting.participantUserIds || [])
      .map((uid) => uid.trim())
      .includes(memberUid);
    if (!isOrganizer && !isParticipant) continue;

    if (
      meeting.startAtMs < options.rangeStartMs ||
      meeting.startAtMs > options.rangeEndMs
    ) {
      continue;
    }

    seen.add(meeting.id);
    const slot = sanitizeTeamAgendaSlot({meeting, memberUid});
    assertSanitizedTeamAgendaSlot(slot as unknown as Record<string, unknown>);
    slots.push(slot);
  }

  slots.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  return slots;
}

export function mergeTeamAgendaSlots(slotsByMember: TeamAgendaSlotDto[][]): TeamAgendaSlotDto[] {
  const merged = slotsByMember.flat();
  merged.sort((a, b) => {
    const startDiff = Date.parse(a.startAt) - Date.parse(b.startAt);
    if (startDiff !== 0) return startDiff;
    return a.memberUid.localeCompare(b.memberUid);
  });
  return merged;
}

/** Contract helper: queries must be per-member + startAt range (no collection-wide scan). */
export function describeTeamAgendaQueryPlan(options: {
  memberUids: string[];
  rangeStartMs: number;
  rangeEndMs: number;
}): Array<{memberUid: string; queries: string[]}> {
  return options.memberUids.map((memberUid) => ({
    memberUid,
    queries: [
      `meetings: organizerId==${memberUid} && startAt>=${options.rangeStartMs} && startAt<=${options.rangeEndMs}`,
      `meetings: participantUserIds array-contains ${memberUid} && startAt>=${options.rangeStartMs} && startAt<=${options.rangeEndMs}`,
    ],
  }));
}
