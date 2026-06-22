type SalesGoalSaveDebugContext = {
  authUid?: string | null
  authEmail?: string | null
  emailVerified?: boolean
  appUserUid?: string | null
  appUserRole?: string | null
  activationStatus?: string | null
  homeTeamId?: string | null
  ownedTeamId?: string | null
  contextMode?: string | null
  effectiveTeamId?: string | null
}

export function logSalesGoalSaveDebug(
  context: SalesGoalSaveDebugContext,
  details: {
    goalId: string
    payload: Record<string, unknown>
    isUpdate: boolean
  },
): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[SalesGoal Save Debug]', {
    authUid: context.authUid ?? null,
    authEmail: context.authEmail ?? null,
    emailVerified: context.emailVerified ?? false,
    appUserUid: context.appUserUid ?? null,
    appUserRole: context.appUserRole ?? null,
    activationStatus: context.activationStatus ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    contextMode: context.contextMode ?? null,
    effectiveTeamId: context.effectiveTeamId ?? null,
    goalId: details.goalId,
    isUpdate: details.isUpdate,
    payload: details.payload,
  })
}

export function logSalesGoalSaveError(
  error: unknown,
  context: SalesGoalSaveDebugContext,
  details: {
    goalId: string
    payload: Record<string, unknown>
  },
): void {
  if (!import.meta.env.DEV) {
    return
  }

  const firebaseError = error as { code?: string; message?: string }

  console.error(
    '[SalesGoal Save Error JSON]',
    JSON.stringify(
      {
        errorCode: firebaseError.code ?? 'unknown',
        errorMessage: firebaseError.message ?? String(error),
        authUid: context.authUid ?? null,
        effectiveTeamId: context.effectiveTeamId ?? null,
        goalId: details.goalId,
        payload: details.payload,
      },
      null,
      2,
    ),
  )
}

type SalesGoalLoadDebugContext = SalesGoalSaveDebugContext & {
  periodTypeRequested?: string | null
  expectedGoalId?: string | null
  expectedPath?: string | null
}

export function logSalesGoalLoadDebug(context: SalesGoalLoadDebugContext): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[SalesGoal Load Debug]', {
    authUid: context.authUid ?? null,
    authEmail: context.authEmail ?? null,
    emailVerified: context.emailVerified ?? false,
    appUserUid: context.appUserUid ?? null,
    appUserRole: context.appUserRole ?? null,
    activationStatus: context.activationStatus ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    contextMode: context.contextMode ?? null,
    effectiveTeamId: context.effectiveTeamId ?? null,
    periodTypeRequested: context.periodTypeRequested ?? null,
    expectedGoalId: context.expectedGoalId ?? null,
    expectedPath: context.expectedPath ?? null,
  })
}

export function logSalesGoalLoadError(
  error: unknown,
  context: SalesGoalLoadDebugContext,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  const firebaseError = error as { code?: string; message?: string }

  console.error(
    '[SalesGoal Load Error JSON]',
    JSON.stringify(
      {
        errorCode: firebaseError.code ?? 'unknown',
        errorMessage: firebaseError.message ?? String(error),
        authUid: context.authUid ?? null,
        contextMode: context.contextMode ?? null,
        effectiveTeamId: context.effectiveTeamId ?? null,
        periodTypeRequested: context.periodTypeRequested ?? null,
        expectedGoalId: context.expectedGoalId ?? null,
        expectedPath: context.expectedPath ?? null,
      },
      null,
      2,
    ),
  )
}

export type { SalesGoalLoadDebugContext, SalesGoalSaveDebugContext }

export type SalesReportCreateDebugContext = SalesGoalSaveDebugContext & {
  goalId?: string | null
  goalTeamId?: string | null
  goalStatus?: string | null
}

export function logSalesReportCreateDebug(
  context: SalesReportCreateDebugContext,
  payload: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[SalesReport Create Debug]', {
    authUid: context.authUid ?? null,
    authEmail: context.authEmail ?? null,
    emailVerified: context.emailVerified ?? false,
    appUserUid: context.appUserUid ?? null,
    appUserRole: context.appUserRole ?? null,
    activationStatus: context.activationStatus ?? null,
    homeTeamId: context.homeTeamId ?? null,
    ownedTeamId: context.ownedTeamId ?? null,
    contextMode: context.contextMode ?? null,
    effectiveTeamId: context.effectiveTeamId ?? null,
    goalId: context.goalId ?? null,
    goalTeamId: context.goalTeamId ?? null,
    goalStatus: context.goalStatus ?? null,
    payload,
  })
}

export function logSalesReportCreateError(
  error: unknown,
  context: SalesReportCreateDebugContext,
  payload: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  const firebaseError = error as { code?: string; message?: string }

  console.error(
    '[SalesReport Create Error JSON]',
    JSON.stringify(
      {
        errorCode: firebaseError.code ?? 'unknown',
        errorMessage: firebaseError.message ?? String(error),
        authUid: context.authUid ?? null,
        effectiveTeamId: context.effectiveTeamId ?? null,
        goalId: context.goalId ?? null,
        payload,
      },
      null,
      2,
    ),
  )
}

export type SalesReportNotificationDebugContext = {
  authUid?: string | null
  teamId?: string | null
  ownerUid?: string | null
  salesReportId?: string | null
  goalId?: string | null
  amount?: number | null
  currency?: string | null
}

export function logSalesReportNotificationDebug(
  context: SalesReportNotificationDebugContext,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[SalesReport Notification Debug]', {
    authUid: context.authUid ?? null,
    teamId: context.teamId ?? null,
    ownerUid: context.ownerUid ?? null,
    salesReportId: context.salesReportId ?? null,
    goalId: context.goalId ?? null,
    amount: context.amount ?? null,
    currency: context.currency ?? null,
  })
}

export function logSalesReportNotificationWarning(
  error: unknown,
  context: SalesReportNotificationDebugContext,
): void {
  if (!import.meta.env.DEV) {
    return
  }

  const firebaseError = error as { code?: string; message?: string }
  const message =
    typeof error === 'string'
      ? error
      : firebaseError.message ?? String(error)

  console.warn('[SalesReport Notification Warning]', {
    errorCode: firebaseError.code ?? 'warning',
    errorMessage: message,
    authUid: context.authUid ?? null,
    teamId: context.teamId ?? null,
    ownerUid: context.ownerUid ?? null,
    salesReportId: context.salesReportId ?? null,
    goalId: context.goalId ?? null,
    amount: context.amount ?? null,
    currency: context.currency ?? null,
  })
}
