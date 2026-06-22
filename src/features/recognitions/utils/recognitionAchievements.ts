import type { MonthlyMvpResult } from '@/features/recognitions/types/monthly-mvp.types'
import type {
  PositiveFomoContext,
  RecognitionAchievement,
} from '@/features/recognitions/types/recognition-achievement.types'
import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type { TeamRecognition } from '@/features/recognitions/types/team-recognition.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { getTeamRecognitionTypeLabel } from '@/features/recognitions/utils/teamRecognitionCopy'

export const RECENT_ACHIEVEMENTS_SECTION = {
  title: 'Logros recientes',
  subtitle: 'Pequeños avances que mantienen al equipo en movimiento.',
  emptyMessage:
    'Aún no hay logros recientes. Completa acciones, revisa formación o reconoce a un miembro para empezar a mover el mural.',
  fomoTitle: 'El podio está abierto',
}

export const POSITIVE_FOMO_MESSAGES = {
  noPublishedRanking:
    'El podio aún está abierto. Completa acciones para empezar a sumar puntos.',
  memberWithRanking:
    'Sigue avanzando. Cada acción puede acercarte al podio.',
  leaderWithRanking:
    'Publica el ranking semanal para mantener al equipo motivado.',
  withRecentRecognitions:
    'El reconocimiento también mueve al equipo. Celebra avances para reforzar la constancia.',
}

const ACHIEVEMENT_TYPE_LABELS: Record<RecognitionAchievement['type'], string> = {
  recognition: 'Reconocimiento',
  podium: 'Podio',
  team_movement: 'Equipo activo',
  mvp: 'MVP del mes',
  personal: 'Tu avance',
}

export function getRecognitionAchievementTypeLabel(type: RecognitionAchievement['type']): string {
  return ACHIEVEMENT_TYPE_LABELS[type]
}

function getAchievementSortTime(achievement: RecognitionAchievement): number {
  return achievement.createdAt?.toMillis?.() ?? 0
}

function buildRecognitionAchievementItems(recognitions: TeamRecognition[]): RecognitionAchievement[] {
  return recognitions.slice(0, 5).map((recognition) => ({
    id: `recognition-${recognition.id}`,
    type: 'recognition',
    title: 'Reconocimiento compartido',
    description: `${recognition.recipientName} recibió un reconocimiento por ${getTeamRecognitionTypeLabel(recognition.type).toLowerCase()}.`,
    memberName: recognition.recipientName,
    iconType: 'recognition',
    createdAt: recognition.createdAt,
    visibility: recognition.visibility,
  }))
}

function buildPodiumAchievement(snapshot: RecognitionWeeklySnapshot): RecognitionAchievement | null {
  const firstPlace =
    snapshot.podium.find((entry) => entry.position === 1) ??
    snapshot.ranking.find((entry) => entry.position === 1) ??
    snapshot.podium[0] ??
    snapshot.ranking[0]

  if (!firstPlace) {
    return null
  }

  return {
    id: `podium-${snapshot.id}`,
    type: 'podium',
    title: 'Podio semanal publicado',
    description: `El podio semanal ya está publicado. ${firstPlace.memberName} lidera con ${firstPlace.score} puntos.`,
    memberName: firstPlace.memberName,
    iconType: 'podium',
    createdAt: snapshot.generatedAt,
    visibility: 'team',
  }
}

function buildTeamMovementAchievement(snapshot: RecognitionWeeklySnapshot): RecognitionAchievement | null {
  const membersWithPoints = snapshot.ranking.filter((entry) => entry.score > 0).length

  if (membersWithPoints === 0) {
    return null
  }

  const membersLabel =
    membersWithPoints === 1 ? '1 miembro sumó puntos' : `${membersWithPoints} miembros sumaron puntos`

  return {
    id: `movement-${snapshot.id}`,
    type: 'team_movement',
    title: 'El equipo se está moviendo',
    description: `${membersLabel} esta semana.`,
    iconType: 'team_movement',
    createdAt: snapshot.generatedAt,
    visibility: 'team',
  }
}

function buildMvpAchievement(monthlyMvp: MonthlyMvpResult): RecognitionAchievement | null {
  if (!monthlyMvp.winner) {
    return null
  }

  return {
    id: `mvp-${monthlyMvp.monthKey}`,
    type: 'mvp',
    title: 'Carrera MVP activa',
    description: `${monthlyMvp.winner.memberName} lidera la carrera por el MVP del mes.`,
    memberName: monthlyMvp.winner.memberName,
    iconType: 'mvp',
    createdAt: null,
    visibility: 'team',
  }
}

function buildPersonalAchievement(
  points: number,
  viewRole: RecognitionsViewRole,
): RecognitionAchievement | null {
  if (viewRole !== 'member' || points <= 0) {
    return null
  }

  return {
    id: `personal-${points}`,
    type: 'personal',
    title: 'Tu avance personal',
    description: `Vas con ${points} puntos esta semana. Sigue avanzando para subir posiciones.`,
    iconType: 'personal',
    createdAt: null,
    visibility: 'private',
  }
}

export type BuildRecognitionAchievementsInput = {
  recognitions: TeamRecognition[]
  latestPublishedSnapshot: RecognitionWeeklySnapshot | null
  monthlyMvp: MonthlyMvpResult | null
  personalWeeklyPoints: number | null
  viewRole: RecognitionsViewRole
  currentMemberUid: string | null
}

export function buildRecognitionAchievements(input: BuildRecognitionAchievementsInput): RecognitionAchievement[] {
  const achievements: RecognitionAchievement[] = [
    ...buildRecognitionAchievementItems(input.recognitions),
  ]

  if (input.latestPublishedSnapshot) {
    const podiumAchievement = buildPodiumAchievement(input.latestPublishedSnapshot)
    const movementAchievement = buildTeamMovementAchievement(input.latestPublishedSnapshot)

    if (podiumAchievement) {
      achievements.push(podiumAchievement)
    }

    if (movementAchievement) {
      achievements.push(movementAchievement)
    }
  }

  if (input.monthlyMvp) {
    const mvpAchievement = buildMvpAchievement(input.monthlyMvp)

    if (mvpAchievement) {
      achievements.push(mvpAchievement)
    }
  }

  let personalPoints = input.personalWeeklyPoints

  if (
    input.viewRole === 'member' &&
    input.currentMemberUid &&
    input.latestPublishedSnapshot &&
    personalPoints === null
  ) {
    const memberEntry = input.latestPublishedSnapshot.ranking.find(
      (entry) => entry.memberUid === input.currentMemberUid,
    )
    personalPoints = memberEntry?.score ?? null
  }

  const personalAchievement = buildPersonalAchievement(personalPoints ?? 0, input.viewRole)

  if (personalAchievement) {
    achievements.push(personalAchievement)
  }

  return achievements
    .sort((left, right) => getAchievementSortTime(right) - getAchievementSortTime(left))
    .slice(0, 8)
}

export function buildPositiveFomoMessage(context: PositiveFomoContext): string {
  if (context.hasRecentRecognitions) {
    return POSITIVE_FOMO_MESSAGES.withRecentRecognitions
  }

  if (context.hasPublishedRanking) {
    return context.viewRole === 'leader'
      ? POSITIVE_FOMO_MESSAGES.leaderWithRanking
      : POSITIVE_FOMO_MESSAGES.memberWithRanking
  }

  return POSITIVE_FOMO_MESSAGES.noPublishedRanking
}

export function formatRecognitionAchievementDate(
  createdAt: RecognitionAchievement['createdAt'],
): string | null {
  if (!createdAt?.toDate) {
    return null
  }

  return createdAt.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}
