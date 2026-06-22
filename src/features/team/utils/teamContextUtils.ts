import type { AppUser } from '@/types'
import type { AcademyTeamContext } from '@/features/academy/utils/academyTeamAccess'
import type { ActionPlanTeamContext } from '@/features/action-plan/utils/actionPlanTeamAccess'

export type TeamContextMode = 'member' | 'leader'

export type DualTeamAvailability = {
  memberTeamId: string | null
  leaderTeamId: string | null
  needsSelector: boolean
}

export const TEAM_CONTEXT_SELECTOR_COPY = {
  pageTitle: 'Organiza tu experiencia por grupo',
  pageSubtitle:
    'Para mantener todo limpio y enfocado, primero elige desde qué grupo quieres trabajar.',
  title: '¿Desde qué grupo quieres trabajar?',
  subtitle:
    'Tienes acceso a más de un contexto. Elige si quieres avanzar como miembro del grupo al que perteneces o administrar tu propio grupo.',
  memberCard: {
    title: 'Grupo al que pertenezco',
    description:
      'Accede al contenido, plan y reconocimientos del grupo donde formas parte como miembro.',
    role: 'Miembro',
    cta: 'Entrar como miembro',
    fallbackName: 'Grupo al que pertenezco',
  },
  leaderCard: {
    title: 'Mi propio grupo',
    description:
      'Administra el contenido, plan, reconocimientos y avances de tu propio equipo.',
    role: 'Líder',
    cta: 'Entrar como líder',
    fallbackName: 'Mi propio grupo',
  },
  switchLabel: 'Cambiar grupo',
} as const

export function resolveLeaderTeamId(appUser: AppUser | null | undefined): string | null {
  const ownedTeamId = appUser?.ownedTeamId?.trim() || null
  const isActiveLeader = appUser?.activationStatus === 'active' && Boolean(ownedTeamId)

  return isActiveLeader ? ownedTeamId : null
}

export function resolveDualTeamAvailability(
  appUser: AppUser | null | undefined,
  resolvedHomeTeamId?: string | null,
): DualTeamAvailability {
  const leaderTeamId = resolveLeaderTeamId(appUser)
  const rawHomeTeamId = resolvedHomeTeamId?.trim() || appUser?.homeTeamId?.trim() || null
  const memberTeamId =
    rawHomeTeamId && rawHomeTeamId !== leaderTeamId ? rawHomeTeamId : null

  return {
    memberTeamId,
    leaderTeamId,
    needsSelector: Boolean(memberTeamId && leaderTeamId),
  }
}

export function parseTeamContextParam(value: string | null): TeamContextMode | null {
  if (value === 'member' || value === 'leader') {
    return value
  }

  return null
}

export function resolveTeamContextMode(
  contextParam: string | null,
  availability: DualTeamAvailability,
): TeamContextMode | null {
  if (!availability.memberTeamId && !availability.leaderTeamId) {
    return null
  }

  if (!availability.needsSelector) {
    if (availability.leaderTeamId && !availability.memberTeamId) {
      return 'leader'
    }

    if (availability.memberTeamId && !availability.leaderTeamId) {
      return 'member'
    }

    return availability.leaderTeamId ? 'leader' : 'member'
  }

  const parsed = parseTeamContextParam(contextParam)

  if (parsed === 'member' && availability.memberTeamId) {
    return 'member'
  }

  if (parsed === 'leader' && availability.leaderTeamId) {
    return 'leader'
  }

  return null
}

export function resolveTeamIdForMode(
  mode: TeamContextMode,
  availability: DualTeamAvailability,
): string | null {
  return mode === 'member' ? availability.memberTeamId : availability.leaderTeamId
}

export function applyDualTeamSectionFilter<
  T extends {
    memberTeamId: string | null
    managedTeamId: string | null
    hasMemberSection: boolean
    hasManagedSection: boolean
  },
>(context: T, mode: TeamContextMode): T {
  if (mode === 'member') {
    return {
      ...context,
      managedTeamId: null,
      hasManagedSection: false,
      hasMemberSection: Boolean(context.memberTeamId),
    }
  }

  return {
    ...context,
    memberTeamId: null,
    hasMemberSection: false,
    hasManagedSection: Boolean(context.managedTeamId),
  }
}

export function applyAcademyTeamContextMode(
  context: AcademyTeamContext,
  mode: TeamContextMode,
): AcademyTeamContext {
  const filtered = applyDualTeamSectionFilter(context, mode)

  return {
    ...filtered,
    canManageContent: mode === 'leader' && Boolean(context.managedTeamId),
  }
}

export function applyActionPlanTeamContextMode(
  context: ActionPlanTeamContext,
  mode: TeamContextMode,
): ActionPlanTeamContext {
  const filtered = applyDualTeamSectionFilter(context, mode)

  if (mode === 'member') {
    return {
      ...filtered,
      canManageTeamTasks: false,
      canTrackMemberProgress: Boolean(context.memberTeamId),
    }
  }

  return {
    ...filtered,
    canManageTeamTasks: Boolean(context.managedTeamId),
    canTrackMemberProgress: Boolean(context.managedTeamId),
  }
}
