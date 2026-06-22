import type { AppUser } from '@/types'
import type { ActionTask } from '@/features/action-plan/types/action-plan.types'

export type ActionPlanTeamContext = {
  managedTeamId: string | null
  memberTeamId: string | null
  homeTeamId: string | null
  hasManagedSection: boolean
  hasMemberSection: boolean
  isBlocked: boolean
  canManageTeamTasks: boolean
  canTrackMemberProgress: boolean
}

export function resolveActionPlanTeamContext(
  appUser: AppUser | null,
  resolvedHomeTeamId?: string | null,
): ActionPlanTeamContext {
  const managedTeamId = appUser?.ownedTeamId ?? null
  const rawHomeTeamId = resolvedHomeTeamId ?? appUser?.homeTeamId ?? null
  const memberTeamId =
    rawHomeTeamId && rawHomeTeamId !== managedTeamId ? rawHomeTeamId : null
  const isAdmin = appUser?.role === 'admin'
  const hasTeamAccess = Boolean(managedTeamId || rawHomeTeamId)

  return {
    managedTeamId,
    memberTeamId,
    homeTeamId: rawHomeTeamId,
    hasManagedSection: Boolean(managedTeamId),
    hasMemberSection: Boolean(memberTeamId),
    isBlocked: !hasTeamAccess && !isAdmin,
    canManageTeamTasks: Boolean(managedTeamId),
    canTrackMemberProgress: Boolean(memberTeamId || managedTeamId),
  }
}

export function isLegacyOwnedTask(
  task: Pick<ActionTask, 'ownerUid' | 'teamId'>,
  ownerUid: string,
  ownedTeamId: string | null,
): boolean {
  if (ownedTeamId && task.teamId === ownedTeamId) {
    return true
  }

  return !task.teamId && task.ownerUid === ownerUid
}

export function mergeManagedTeamTasks(
  teamTasks: ActionTask[],
  legacyOwnerTasks: ActionTask[],
  ownerUid: string,
  ownedTeamId: string,
): ActionTask[] {
  const merged = new Map<string, ActionTask>()

  for (const task of teamTasks) {
    if (task.teamId === ownedTeamId) {
      merged.set(task.id, task)
    }
  }

  for (const task of legacyOwnerTasks) {
    if (isLegacyOwnedTask(task, ownerUid, ownedTeamId)) {
      merged.set(task.id, task)
    }
  }

  return [...merged.values()].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}
