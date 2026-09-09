/**
 * Pure group membership authorization helpers (no Firestore I/O).
 * Source of truth collections (resolved by callers via Admin SDK):
 * - teams/{teamId}
 * - teamMembers/{teamId}_{memberUid}
 */

export type TeamMemberRecord = {
  memberUid: string;
  role?: string;
  status?: string;
  memberName?: string;
  memberEmail?: string;
};

export type ResolvedGroupParticipant = {
  userId: string;
  name: string;
  email?: string;
};

export function isActiveTeamMemberRecord(member: TeamMemberRecord): boolean {
  return member.status === "active" && Boolean(member.memberUid?.trim());
}

export function canUserManageTeamMeetings(options: {
  uid: string;
  teamOwnerUid: string;
  membership: TeamMemberRecord | null;
}): boolean {
  const uid = options.uid.trim();
  if (!uid) {
    return false;
  }

  if (options.teamOwnerUid.trim() === uid) {
    return true;
  }

  if (!options.membership || !isActiveTeamMemberRecord(options.membership)) {
    return false;
  }

  return options.membership.memberUid.trim() === uid;
}

/**
 * Build authorized participantUserIds + participant payloads.
 * - Rejects any selectedUserId not in real membership (no silent drop).
 * - Excludes organizer from participantUserIds.
 * - mode "all": every active member except organizer.
 */
export function resolveAuthorizedGroupParticipants(options: {
  organizerId: string;
  members: TeamMemberRecord[];
  mode: "all" | "partial";
  selectedUserIds?: string[];
}): {
  participantUserIds: string[];
  participants: ResolvedGroupParticipant[];
  attendeeEmails: string[];
} {
  const organizerId = options.organizerId.trim();
  const activeMembers = options.members.filter(isActiveTeamMemberRecord);
  const membershipByUid = new Map<string, TeamMemberRecord>();

  for (const member of activeMembers) {
    membershipByUid.set(member.memberUid.trim(), member);
  }

  let selectedIds: string[];

  if (options.mode === "all") {
    selectedIds = [...membershipByUid.keys()].filter((uid) => uid !== organizerId);
  } else {
    const raw = options.selectedUserIds || [];
    if (raw.length === 0) {
      throw new Error("EMPTY_SELECTION");
    }

    const normalized = raw.map((uid) => uid.trim()).filter(Boolean);
    const unique = [...new Set(normalized)];

    for (const uid of unique) {
      if (uid === organizerId) {
        continue;
      }
      if (!membershipByUid.has(uid)) {
        throw new Error(`FOREIGN_UID:${uid}`);
      }
    }

    selectedIds = unique.filter((uid) => uid !== organizerId);
  }

  if (selectedIds.length === 0) {
    throw new Error("EMPTY_PARTICIPANTS");
  }

  selectedIds.sort();

  const participants: ResolvedGroupParticipant[] = selectedIds.map((uid) => {
    const member = membershipByUid.get(uid)!;
    return {
      userId: uid,
      name: member.memberName?.trim() || member.memberEmail?.trim() || "Miembro",
      email: member.memberEmail?.trim().toLowerCase() || undefined,
    };
  });

  const attendeeEmails = [
    ...new Set(
      participants
        .map((participant) => participant.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  return {
    participantUserIds: selectedIds,
    participants: participants.map((participant) => ({
      ...participant,
      // MeetingParticipant shape added by caller
    })),
    attendeeEmails,
  };
}
