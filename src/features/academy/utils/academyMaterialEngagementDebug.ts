export type AcademyEngagementDebugContext = {
  authUid: string | null
  authEmail: string | null
  emailVerified: boolean
  appUserUid?: string | null
  homeTeamId?: string | null
  ownedTeamId?: string | null
  materialId: string
  materialTeamId: string | null
  resolvedEngagementTeamId: string | null
  memberUid: string
}

export function buildEngagementDocumentId(
  teamId: string,
  materialId: string,
  memberUid: string,
): string {
  return `${teamId}_${materialId}_${memberUid}`
}

export function logAcademyEngagementDebug(context: AcademyEngagementDebugContext): void {
  if (!import.meta.env.DEV) {
    return
  }

  const engagementId = context.resolvedEngagementTeamId
    ? buildEngagementDocumentId(
        context.resolvedEngagementTeamId,
        context.materialId,
        context.memberUid,
      )
    : null

  const expectedTeamMemberDocId = context.resolvedEngagementTeamId
    ? `${context.resolvedEngagementTeamId}_${context.authUid ?? context.memberUid}`
    : null

  console.info('[Academia Engagement Debug]', {
    authUid: context.authUid,
    authEmail: context.authEmail,
    emailVerified: context.emailVerified,
    appUserUid: context.appUserUid ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    materialId: context.materialId,
    materialTeamId: context.materialTeamId,
    resolvedEngagementTeamId: context.resolvedEngagementTeamId,
    memberUid: context.memberUid,
    engagementId,
    expectedTeamMemberDocId,
  })
}
