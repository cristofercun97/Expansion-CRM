import type { RecognitionWeekPeriod } from '@/features/recognitions/types/recognition-ranking.types'

export function buildRecognitionWeekKey(period: RecognitionWeekPeriod): string {
  return `${period.weekStartIso}_${period.weekEndIso}`
}

export function buildRecognitionSnapshotDocId(teamId: string, period: RecognitionWeekPeriod): string {
  return `${teamId.trim()}_${buildRecognitionWeekKey(period)}`
}

export const MEMBER_UNPUBLISHED_RANKING_TITLE = 'Ranking semanal no publicado'

export const MEMBER_UNPUBLISHED_RANKING_MESSAGE =
  'El ranking semanal aún no ha sido publicado.'

export const MEMBER_UNPUBLISHED_RANKING_MOTIVATION =
  'Completa acciones, formación y tareas para sumar puntos esta semana.'

export const LEADER_PUBLISH_RANKING_LABEL = 'Publicar ranking semanal'

export const LEADER_UPDATE_RANKING_LABEL = 'Actualizar ranking semanal'

export const LEADER_PUBLISH_RANKING_SUCCESS = 'Ranking semanal publicado para tu equipo.'

export const LEADER_PUBLISH_RANKING_ERROR =
  'No pudimos publicar el ranking semanal. Inténtalo de nuevo.'
