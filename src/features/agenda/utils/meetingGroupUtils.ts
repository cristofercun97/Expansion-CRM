import type { MeetingParticipant } from '@/features/agenda/types/meeting.types'
import type { TeamMember } from '@/features/team/types/team.types'

export type AccessibleTeamOption = {
  id: string
  name: string
  ownerUid: string
}

export type GroupMemberOption = {
  userId: string
  name: string
  email?: string
  photoURL?: string
}

export function mapActiveMembersExcludingOrganizer(
  members: TeamMember[],
  organizerId: string,
): GroupMemberOption[] {
  const organizer = organizerId.trim()

  return members
    .filter((member) => member.status === 'active' && member.memberUid.trim() !== organizer)
    .map((member) => ({
      userId: member.memberUid,
      name: member.memberName?.trim() || member.memberEmail?.trim() || 'Miembro',
      email: member.memberEmail?.trim() || undefined,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

export function buildGroupParticipantsFromMembers(
  members: GroupMemberOption[],
  selectedUserIds?: string[],
): MeetingParticipant[] {
  const selected = selectedUserIds
    ? new Set(selectedUserIds.map((id) => id.trim()).filter(Boolean))
    : null

  return members
    .filter((member) => (selected ? selected.has(member.userId) : true))
    .map((member) => ({
      type: 'user' as const,
      userId: member.userId,
      name: member.name,
      email: member.email,
    }))
}

export function assertParticipantsWithinGroup(
  participants: MeetingParticipant[],
  allowedMemberIds: Set<string>,
): void {
  for (const participant of participants) {
    if (participant.type !== 'user') {
      continue
    }

    const userId = participant.userId?.trim()
    if (!userId) {
      throw new Error('Participante interno sin UID.')
    }

    if (!allowedMemberIds.has(userId)) {
      throw new Error('No puedes añadir participantes fuera del grupo seleccionado.')
    }
  }
}
