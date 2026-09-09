import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from '@/lib/firebase/functions'
import type { AgendaTeamMemberMetrics } from '@/features/agenda/utils/agendaMetricsUtils'

export type GetTeamAgendaMetricsInput = {
  teamId: string
  rangeStartIso: string
  rangeEndIso: string
}

export type GetTeamAgendaMetricsResult = {
  teamId: string
  rangeStartIso: string
  rangeEndIso: string
  members: AgendaTeamMemberMetrics[]
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
  return 'No pudimos cargar las métricas del equipo.'
}

async function getTeamAgendaMetrics(
  input: GetTeamAgendaMetricsInput,
): Promise<GetTeamAgendaMetricsResult> {
  const callable = httpsCallable<GetTeamAgendaMetricsInput, GetTeamAgendaMetricsResult>(
    getFirebaseFunctions(),
    'getTeamAgendaMetrics',
  )
  try {
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(extractCallableErrorMessage(error), { cause: error })
  }
}

export const teamAgendaMetricsFunctionsService = {
  getTeamAgendaMetrics,
}
