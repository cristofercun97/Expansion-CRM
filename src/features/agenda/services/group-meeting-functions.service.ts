import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/lib/firebase/functions'

export type GroupMemberSelectionMode = 'all' | 'partial'

export type CreateGroupMeetingCallableInput = {
  title: string
  type?: string
  description?: string
  notes?: string
  startAtIso: string
  durationMinutes: number
  timezone: string
  groupId: string
  memberSelectionMode: GroupMemberSelectionMode
  selectedUserIds?: string[]
  meetingMode: 'video' | 'in_person' | 'other'
  videoProvider: 'manual' | 'google_meet' | 'none'
  meetingUrl?: string | null
  location?: string | null
  organizerName?: string
}

export type CreateGroupMeetingCallableResult = {
  meetingId: string
  participantUserIds: string[]
  groupId: string
  groupNameSnapshot: string
  googleCalendarEventId: string | null
  googleMeetUrl: string | null
}

export type UpdateGroupMeetingParticipantsInput = {
  meetingId: string
  memberSelectionMode: GroupMemberSelectionMode
  selectedUserIds?: string[]
  syncGoogleAttendees?: boolean
  title?: string
  description?: string
  startAtIso?: string
  endAtIso?: string
  timezone?: string
}

export type UpdateGroupMeetingParticipantsResult = {
  meetingId: string
  participantUserIds: string[]
  groupId: string
}

function extractCallableErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const callableError = error as { message?: string; code?: string }
    if (typeof callableError.message === 'string' && callableError.message.trim()) {
      return callableError.message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'No pudimos completar la operación de reunión grupal.'
}

async function createGroupMeeting(
  input: CreateGroupMeetingCallableInput,
): Promise<CreateGroupMeetingCallableResult> {
  const callable = httpsCallable<CreateGroupMeetingCallableInput, CreateGroupMeetingCallableResult>(
    getFirebaseFunctions(),
    'createGroupMeeting',
  )

  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function updateGroupMeetingParticipants(
  input: UpdateGroupMeetingParticipantsInput,
): Promise<UpdateGroupMeetingParticipantsResult> {
  const callable = httpsCallable<
    UpdateGroupMeetingParticipantsInput,
    UpdateGroupMeetingParticipantsResult
  >(getFirebaseFunctions(), 'updateGroupMeetingParticipants')

  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const groupMeetingFunctionsService = {
  createGroupMeeting,
  updateGroupMeetingParticipants,
}
