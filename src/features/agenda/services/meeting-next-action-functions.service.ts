import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/lib/firebase/functions'

export type CreateMeetingNextActionInput = {
  meetingId: string
  title: string
  description?: string
  dueDate: string
  idempotencyKey?: string
}

export type CreateMeetingNextActionResult = {
  taskId: string
  reused: boolean
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
  return 'No pudimos crear la próxima acción.'
}

async function createMeetingNextAction(
  input: CreateMeetingNextActionInput,
): Promise<CreateMeetingNextActionResult> {
  const callable = httpsCallable<CreateMeetingNextActionInput, CreateMeetingNextActionResult>(
    getFirebaseFunctions(),
    'createMeetingNextAction',
  )
  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const meetingNextActionFunctionsService = {
  createMeetingNextAction,
}
