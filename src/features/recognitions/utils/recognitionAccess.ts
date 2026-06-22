import type { AppUser } from '@/types'
import type { DualTeamAvailability, TeamContextMode } from '@/features/team/utils/teamContextUtils'

export type RecognitionsViewRole = 'leader' | 'member' | 'none'

export type RecognitionsContext = {
  canAccess: boolean
  teamId: string | null
  viewRole: RecognitionsViewRole
  isAdmin: boolean
}

export function resolveRecognitionsContext(
  appUser: AppUser | null | undefined,
): RecognitionsContext {
  const isAdmin = appUser?.role === 'admin'
  const ownedTeamId = appUser?.ownedTeamId?.trim() || null
  const homeTeamId = appUser?.homeTeamId?.trim() || null
  const isActiveLeader = appUser?.activationStatus === 'active' && Boolean(ownedTeamId)

  const canAccess = Boolean(isAdmin || isActiveLeader || homeTeamId)

  if (isActiveLeader) {
    return {
      canAccess,
      teamId: ownedTeamId,
      viewRole: 'leader',
      isAdmin: Boolean(isAdmin),
    }
  }

  if (homeTeamId) {
    return {
      canAccess,
      teamId: homeTeamId,
      viewRole: 'member',
      isAdmin: Boolean(isAdmin),
    }
  }

  return {
    canAccess,
    teamId: null,
    viewRole: 'none',
    isAdmin: Boolean(isAdmin),
  }
}

export function resolveRecognitionsContextForMode(
  appUser: AppUser | null | undefined,
  mode: TeamContextMode | null,
  availability: DualTeamAvailability,
): RecognitionsContext {
  const isAdmin = appUser?.role === 'admin'

  if (mode === 'member' && availability.memberTeamId) {
    return {
      canAccess: true,
      teamId: availability.memberTeamId,
      viewRole: 'member',
      isAdmin: Boolean(isAdmin),
    }
  }

  if (mode === 'leader' && availability.leaderTeamId) {
    return {
      canAccess: true,
      teamId: availability.leaderTeamId,
      viewRole: 'leader',
      isAdmin: Boolean(isAdmin),
    }
  }

  if (!availability.needsSelector) {
    if (availability.leaderTeamId && !availability.memberTeamId) {
      return {
        canAccess: true,
        teamId: availability.leaderTeamId,
        viewRole: 'leader',
        isAdmin: Boolean(isAdmin),
      }
    }

    if (availability.memberTeamId) {
      return {
        canAccess: true,
        teamId: availability.memberTeamId,
        viewRole: 'member',
        isAdmin: Boolean(isAdmin),
      }
    }
  }

  return {
    canAccess: Boolean(isAdmin || availability.memberTeamId || availability.leaderTeamId),
    teamId: null,
    viewRole: 'none',
    isAdmin: Boolean(isAdmin),
  }
}
