import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { COLLECTIONS } from '@/lib/firebase'
import type { RecognitionWeekPeriod } from '@/features/recognitions/types/recognition-ranking.types'
import {
  buildRecognitionSnapshotDocId,
  buildRecognitionWeekKey,
} from '@/features/recognitions/utils/recognitionWeeklySnapshotUtils'

export type RecognitionRankingSource =
  | 'teamMembers'
  | 'engagements'
  | 'attempts'
  | 'taskProgress'
  | 'reminders'
  | 'salesReports'
  | 'snapshot'

type RecognitionRankingDebugInput = {
  authUid: string | null | undefined
  authEmail: string | null | undefined
  emailVerified: boolean | undefined
  appUserUid: string | null | undefined
  viewRole: RecognitionsViewRole
  teamId: string | null
  ownedTeamId: string | null
  homeTeamId: string | null
  period: RecognitionWeekPeriod
}

type RecognitionRankingSourceDebugInput = {
  source: RecognitionRankingSource
  teamId: string
  authUid: string | null | undefined
  viewRole: RecognitionsViewRole
}

type RecognitionRankingErrorDebugInput = {
  error: unknown
  authUid: string | null | undefined
  viewRole: RecognitionsViewRole
  teamId: string | null
  period: RecognitionWeekPeriod
  failedStep: string
}

export function getFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code)
  }

  return 'unknown'
}

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }

  return 'Unknown error'
}

export function isFirebasePermissionDenied(error: unknown): boolean {
  return getFirebaseErrorCode(error) === 'permission-denied'
}

export function buildRecognitionSnapshotDebugPaths(teamId: string, period: RecognitionWeekPeriod) {
  const weekKey = buildRecognitionWeekKey(period)
  const expectedSnapshotId = buildRecognitionSnapshotDocId(teamId, period)

  return {
    weekKey,
    expectedSnapshotId,
    expectedSnapshotPath: `${COLLECTIONS.recognitionWeeklySnapshots}/${expectedSnapshotId}`,
  }
}

export function logRecognitionRankingDebug(input: RecognitionRankingDebugInput): void {
  if (!import.meta.env.DEV) {
    return
  }

  const normalizedTeamId = input.teamId?.trim() || null
  const snapshotPaths = normalizedTeamId
    ? buildRecognitionSnapshotDebugPaths(normalizedTeamId, input.period)
    : {
        weekKey: buildRecognitionWeekKey(input.period),
        expectedSnapshotId: null,
        expectedSnapshotPath: null,
      }

  console.info('[Recognition Ranking Debug]', {
    authUid: input.authUid ?? null,
    authEmail: input.authEmail ?? null,
    emailVerified: input.emailVerified ?? false,
    appUserUid: input.appUserUid ?? null,
    viewRole: input.viewRole,
    teamId: normalizedTeamId,
    ownedTeamId: input.ownedTeamId,
    homeTeamId: input.homeTeamId,
    isLeaderFlow: input.viewRole === 'leader',
    isMemberFlow: input.viewRole === 'member',
    weekKey: snapshotPaths.weekKey,
    expectedSnapshotId: snapshotPaths.expectedSnapshotId,
    expectedSnapshotPath: snapshotPaths.expectedSnapshotPath,
  })
}

export function logRecognitionRankingSourceDebug(input: RecognitionRankingSourceDebugInput): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[Recognition Ranking Source Debug]', {
    source: input.source,
    teamId: input.teamId,
    authUid: input.authUid ?? null,
    viewRole: input.viewRole,
  })
}

export function logRecognitionRankingError(input: RecognitionRankingErrorDebugInput): void {
  if (!import.meta.env.DEV) {
    return
  }

  const normalizedTeamId = input.teamId?.trim() || null
  const snapshotPaths = normalizedTeamId
    ? buildRecognitionSnapshotDebugPaths(normalizedTeamId, input.period)
    : {
        weekKey: buildRecognitionWeekKey(input.period),
        expectedSnapshotPath: null,
      }

  console.error(
    '[Recognition Ranking Error JSON]',
    JSON.stringify(
      {
        errorCode: getFirebaseErrorCode(input.error),
        errorMessage: getFirebaseErrorMessage(input.error),
        authUid: input.authUid ?? null,
        viewRole: input.viewRole,
        teamId: normalizedTeamId,
        weekKey: snapshotPaths.weekKey,
        failedStep: input.failedStep,
        expectedSnapshotPath: snapshotPaths.expectedSnapshotPath,
      },
      null,
      2,
    ),
  )
}
