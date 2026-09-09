import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/lib/firebase/functions'
import type {
  CreateMeetingInput,
  MeetingMode,
  MeetingType,
  VideoProvider,
} from '@/features/agenda/types/meeting.types'
import type {
  RecurrenceEditScope,
  RecurrenceEndMode,
  RecurrenceFrequency,
} from '@/features/agenda/utils/recurrenceUtils'

export type CreateRecurringMeetingInput = CreateMeetingInput & {
  clientRequestId: string
  frequency: RecurrenceFrequency
  endMode: RecurrenceEndMode
  count?: number
  untilAtIso?: string
  selectedUserIds?: string[]
}

export type CreateRecurringMeetingResult = {
  seriesId: string
  meetingIds: string[]
  occurrenceCount: number
  idempotent: boolean
  firstMeetingId?: string | null
}

export type EditRecurringMeetingScopeInput = {
  meetingId: string
  scope: RecurrenceEditScope
  title?: string
  type?: MeetingType
  description?: string
  notes?: string
  startAtIso?: string
  durationMinutes?: number
  timezone?: string
  meetingMode?: MeetingMode
  videoProvider?: VideoProvider
  meetingUrl?: string | null
  location?: string | null
  syncGoogle?: boolean
}

export type CancelRecurringMeetingScopeInput = {
  meetingId: string
  scope: RecurrenceEditScope
  cancelReason?: string
}

function extractCallableErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const callableError = error as { message?: string }
    if (typeof callableError.message === 'string' && callableError.message.trim()) {
      return callableError.message
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'No pudimos completar la operación de recurrencia.'
}

async function createRecurringMeeting(
  input: CreateRecurringMeetingInput,
): Promise<CreateRecurringMeetingResult> {
  const callable = httpsCallable<Record<string, unknown>, CreateRecurringMeetingResult>(
    getFirebaseFunctions(),
    'createRecurringMeeting',
  )
  try {
    const result = await callable({
      clientRequestId: input.clientRequestId,
      title: input.title,
      type: input.type,
      description: input.description,
      notes: input.notes,
      startAtIso: input.startAt.toISOString(),
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      contactId: input.contactId,
      meetingAudience: input.meetingAudience,
      groupId: input.groupId,
      memberSelectionMode: input.groupMemberSelectionMode,
      selectedUserIds:
        input.selectedUserIds ||
        input.participants
          .map((participant) => participant.userId)
          .filter((uid): uid is string => Boolean(uid)),
      participants: input.participants,
      meetingMode: input.meetingMode,
      videoProvider: input.videoProvider,
      meetingUrl: input.meetingUrl,
      location: input.location,
      organizerName: input.organizerName,
      frequency: input.frequency,
      endMode: input.endMode,
      count: input.count,
      untilAtIso: input.untilAtIso,
    })
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function editRecurringMeetingScope(input: EditRecurringMeetingScopeInput) {
  const callable = httpsCallable(getFirebaseFunctions(), 'editRecurringMeetingScope')
  try {
    const result = await callable(input)
    return result.data as { seriesId: string; updatedMeetingIds: string[] }
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function cancelRecurringMeetingScope(input: CancelRecurringMeetingScopeInput) {
  const callable = httpsCallable(getFirebaseFunctions(), 'cancelRecurringMeetingScope')
  try {
    const result = await callable(input)
    return result.data as { seriesId: string; cancelledMeetingIds: string[] }
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const recurringMeetingFunctionsService = {
  createRecurringMeeting,
  editRecurringMeetingScope,
  cancelRecurringMeetingScope,
}
