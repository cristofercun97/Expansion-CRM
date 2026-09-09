import type { MeetingParticipant } from '@/features/agenda/types/meeting.types'

/** UIDs internos autorizados a leer la reunión (nunca email). */
export function deriveParticipantUserIds(participants: MeetingParticipant[]): string[] {
  const ids = new Set<string>()

  for (const participant of participants) {
    if (participant.type !== 'user') {
      continue
    }

    const userId = participant.userId?.trim()
    if (userId) {
      ids.add(userId)
    }
  }

  return [...ids].sort()
}

export function canManageMeeting(options: {
  meetingOrganizerId: string
  currentUserId: string
  isAdmin: boolean
}): boolean {
  if (!options.currentUserId) {
    return false
  }

  return options.isAdmin || options.meetingOrganizerId === options.currentUserId
}

export function isMeetingParticipant(options: {
  meetingOrganizerId: string
  participantUserIds: string[]
  currentUserId: string
}): boolean {
  if (!options.currentUserId) {
    return false
  }

  if (options.meetingOrganizerId === options.currentUserId) {
    return true
  }

  return options.participantUserIds.includes(options.currentUserId)
}
