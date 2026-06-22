export type ActionTaskProgressDebugContext = {
  authUid: string | null
  authEmail: string | null
  emailVerified: boolean
  appUserUid?: string | null
  homeTeamId?: string | null
  ownedTeamId?: string | null
  taskId: string
  taskTeamId: string | null
  resolvedProgressTeamId: string | null
  memberUid: string
  nextStatus: string
}

export function buildActionTaskProgressDocumentId(taskId: string, memberUid: string): string {
  return `${taskId}_${memberUid}`
}

export function logActionTaskProgressDebug(context: ActionTaskProgressDebugContext): void {
  if (!import.meta.env.DEV) {
    return
  }

  const progressDocId = buildActionTaskProgressDocumentId(context.taskId, context.memberUid)
  const expectedTeamMemberDocId = context.resolvedProgressTeamId
    ? `${context.resolvedProgressTeamId}_${context.authUid ?? context.memberUid}`
    : null

  console.info('[ActionPlan Progress Debug]', {
    authUid: context.authUid,
    authEmail: context.authEmail,
    emailVerified: context.emailVerified,
    appUserUid: context.appUserUid ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    taskId: context.taskId,
    taskTeamId: context.taskTeamId,
    resolvedProgressTeamId: context.resolvedProgressTeamId,
    memberUid: context.memberUid,
    progressDocId,
    expectedTeamMemberDocId,
    nextStatus: context.nextStatus,
  })
}
