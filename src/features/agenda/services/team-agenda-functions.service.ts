import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/lib/firebase/functions'

export type TeamAgendaSlot = {
  meetingId: string
  memberUid: string
  startAt: string
  endAt: string
  status: string
  meetingMode: string
  busy: boolean
}

export type TeamAgendaMember = {
  uid: string
  name: string
}

export type GetTeamAgendaInput = {
  teamId: string
  rangeStartIso: string
  rangeEndIso: string
  memberUid?: string | null
}

export type GetTeamAgendaResult = {
  teamId: string
  rangeStartIso: string
  rangeEndIso: string
  members: TeamAgendaMember[]
  slots: TeamAgendaSlot[]
}

function extractCallableErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const callableError = error as { message?: string; code?: string }
    const code = typeof callableError.code === 'string' ? callableError.code : ''
    if (code.includes('permission-denied')) {
      return 'No tienes permiso para ver esta agenda.'
    }
    if (code.includes('invalid-argument')) {
      return 'Selecciona otro período.'
    }
    if (typeof callableError.message === 'string' && callableError.message.trim()) {
      return callableError.message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'No pudimos cargar la agenda del equipo.'
}

async function getTeamAgenda(input: GetTeamAgendaInput): Promise<GetTeamAgendaResult> {
  const callable = httpsCallable<GetTeamAgendaInput, GetTeamAgendaResult>(
    getFirebaseFunctions(),
    'getTeamAgenda',
  )

  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const teamAgendaFunctionsService = {
  getTeamAgenda,
}
