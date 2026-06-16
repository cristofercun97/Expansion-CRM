import type { AppUser } from '@/types'

export type AcademyTeamContext = {
  managedTeamId: string | null
  memberTeamId: string | null
  hasManagedSection: boolean
  hasMemberSection: boolean
  isBlocked: boolean
  canManageContent: boolean
}

export function resolveAcademyTeamContext(
  appUser: AppUser | null,
  resolvedHomeTeamId?: string | null,
): AcademyTeamContext {
  const managedTeamId = appUser?.ownedTeamId ?? null
  const rawHomeTeamId = resolvedHomeTeamId ?? appUser?.homeTeamId ?? null
  const memberTeamId =
    rawHomeTeamId && rawHomeTeamId !== managedTeamId ? rawHomeTeamId : null
  const isAdmin = appUser?.role === 'admin'
  const hasTeamAccess = Boolean(managedTeamId || rawHomeTeamId)

  return {
    managedTeamId,
    memberTeamId,
    hasManagedSection: Boolean(managedTeamId),
    hasMemberSection: Boolean(memberTeamId),
    isBlocked: !hasTeamAccess && !isAdmin,
    canManageContent: Boolean(managedTeamId),
  }
}

export function isLegacyManagedMaterial(
  material: { ownerUid: string; teamId?: string },
  ownerUid: string,
  ownedTeamId: string | null,
): boolean {
  if (ownedTeamId && material.teamId === ownedTeamId) {
    return true
  }

  return !material.teamId && material.ownerUid === ownerUid
}

export function canTakeAcademyTest(
  material: { teamId?: string },
  test: { isActive: boolean; teamId?: string } | undefined,
  readOnly: boolean,
  fallbackTeamId?: string | null,
): boolean {
  return Boolean(
    readOnly &&
      test?.isActive &&
      resolveMaterialTeamId(material, test, fallbackTeamId),
  )
}

export function resolveMaterialTeamId(
  material: { teamId?: string },
  test?: { teamId?: string },
  fallbackTeamId?: string | null,
): string | null {
  return material.teamId ?? test?.teamId ?? fallbackTeamId ?? null
}

export function resolveEngagementTeamId(material: { teamId?: string }): string | null {
  const materialTeamId = material.teamId?.trim()
  return materialTeamId || null
}
