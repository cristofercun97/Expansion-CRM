import type { MeetingParticipant, MeetingStatus } from '@/features/agenda/types/meeting.types'

/** UIDs internos autorizados a leer la reunión (nunca email). Excluye organizer. */
export function deriveParticipantUserIds(
  participants: MeetingParticipant[],
  organizerId?: string,
): string[] {
  const ids = new Set<string>()
  const organizer = organizerId?.trim() ?? ''

  for (const participant of participants) {
    if (participant.type !== 'user') {
      continue
    }

    const userId = participant.userId?.trim()
    if (!userId || userId === organizer) {
      continue
    }

    ids.add(userId)
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

/** Valid state transitions for Phase 2A. Reschedule keeps `scheduled`. */
export function canTransitionMeetingStatus(
  from: MeetingStatus,
  to: MeetingStatus,
): boolean {
  if (from === to) {
    return true
  }

  if (from === 'scheduled' || from === 'rescheduled') {
    return to === 'scheduled' || to === 'completed' || to === 'cancelled' || to === 'no_show'
  }

  return false
}

export function assertCanTransitionMeetingStatus(from: MeetingStatus, to: MeetingStatus): void {
  if (!canTransitionMeetingStatus(from, to)) {
    throw new Error(`Transición de estado no permitida: ${from} → ${to}.`)
  }
}
