import { httpsCallable } from 'firebase/functions'
import type { GoogleCalendarConnectionStatus } from '@/features/agenda/types/meeting.types'
import { getFirebaseFunctions } from '@/lib/firebase/functions'

type CreateGoogleCalendarEventInput = {
  title: string
  description: string
  startAtIso: string
  endAtIso: string
  timezone: string
  attendeeEmails: string[]
}

type UpdateGoogleCalendarEventInput = CreateGoogleCalendarEventInput & {
  googleCalendarEventId: string
}

type GoogleCalendarEventResult = {
  googleCalendarEventId: string
  googleCalendarHtmlLink: string | null
  googleMeetUrl: string | null
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

  return 'No pudimos completar la operación con Google Calendar.'
}

async function getConnectionStatus(): Promise<GoogleCalendarConnectionStatus> {
  try {
    const callable = httpsCallable<unknown, GoogleCalendarConnectionStatus>(
      getFirebaseFunctions(),
      'getGoogleCalendarConnectionStatus',
    )
    const result = await callable({})
    return result.data
  } catch {
    return {
      connected: false,
      email: null,
      configured: false,
    }
  }
}

async function getConnectUrl(): Promise<string> {
  const callable = httpsCallable<unknown, { url: string }>(
    getFirebaseFunctions(),
    'getGoogleCalendarConnectUrl',
  )

  try {
    const result = await callable({})
    if (!result.data.url) {
      throw new Error('No recibimos la URL de conexión de Google.')
    }
    return result.data.url
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function disconnect(): Promise<void> {
  const callable = httpsCallable(getFirebaseFunctions(), 'disconnectGoogleCalendar')
  try {
    await callable({})
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function createGoogleCalendarEvent(
  input: CreateGoogleCalendarEventInput,
): Promise<GoogleCalendarEventResult> {
  const callable = httpsCallable<CreateGoogleCalendarEventInput, GoogleCalendarEventResult>(
    getFirebaseFunctions(),
    'createGoogleCalendarEvent',
  )

  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function updateGoogleCalendarEvent(
  input: UpdateGoogleCalendarEventInput,
): Promise<GoogleCalendarEventResult> {
  const callable = httpsCallable<UpdateGoogleCalendarEventInput, GoogleCalendarEventResult>(
    getFirebaseFunctions(),
    'updateGoogleCalendarEvent',
  )

  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

async function cancelGoogleCalendarEvent(input: {
  googleCalendarEventId: string
}): Promise<void> {
  const callable = httpsCallable<{ googleCalendarEventId: string }, { ok: boolean }>(
    getFirebaseFunctions(),
    'cancelGoogleCalendarEvent',
  )

  try {
    await callable(input)
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const googleCalendarFunctionsService = {
  getConnectionStatus,
  getConnectUrl,
  disconnect,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  cancelGoogleCalendarEvent,
}
