export type TeamActionMapDebugContext = {
  authUid: string | null
  authEmail: string | null
  emailVerified: boolean
  appUserUid?: string | null
  homeTeamId?: string | null
  ownedTeamId?: string | null
  teamIdUsed: string
}

export function logTeamActionMapReadDebug(context: TeamActionMapDebugContext): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[TeamActionMap Read Debug]', {
    authUid: context.authUid,
    authEmail: context.authEmail,
    emailVerified: context.emailVerified,
    appUserUid: context.appUserUid ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    teamIdUsed: context.teamIdUsed,
    expectedDocPath: `teamActionMaps/${context.teamIdUsed}`,
    expectedTeamMemberDocId: `${context.teamIdUsed}_${context.authUid ?? ''}`,
  })
}

export function logTeamActionMapReadError(
  context: TeamActionMapDebugContext,
  error: unknown,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  const firebaseError = error as { code?: string; message?: string }

  console.error(
    '[TeamActionMap Read Error JSON]',
    JSON.stringify(
      {
        errorCode: firebaseError.code ?? 'unknown',
        errorMessage: firebaseError.message ?? String(error),
        authUid: context.authUid,
        teamIdUsed: context.teamIdUsed,
        expectedDocPath: `teamActionMaps/${context.teamIdUsed}`,
        expectedTeamMemberDocId: `${context.teamIdUsed}_${context.authUid ?? ''}`,
        emailVerified: context.emailVerified,
      },
      null,
      2,
    ),
  )
}
