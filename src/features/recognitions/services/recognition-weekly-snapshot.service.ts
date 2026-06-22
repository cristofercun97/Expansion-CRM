import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import type {
  PublishRecognitionWeeklySnapshotInput,
  RecognitionSnapshotRankingEntry,
  RecognitionSnapshotEntry,
  RecognitionWeeklySnapshot,
} from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type { RecognitionWeekPeriod } from '@/features/recognitions/types/recognition-ranking.types'
import {
  buildRecognitionSnapshotDebugPaths,
  isFirebasePermissionDenied,
  logRecognitionRankingError,
  logRecognitionRankingSourceDebug,
} from '@/features/recognitions/utils/recognitionRankingDebug'
import { getCurrentRecognitionWeekPeriod } from '@/features/recognitions/utils/recognitionScoring'
import { buildRecognitionSnapshotDocId } from '@/features/recognitions/utils/recognitionWeeklySnapshotUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function normalizeSnapshotEntry(value: unknown): RecognitionSnapshotEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const entry = value as Record<string, unknown>

  if (typeof entry.memberUid !== 'string' || typeof entry.memberName !== 'string') {
    return null
  }

  return {
    memberUid: entry.memberUid,
    memberName: entry.memberName,
    score: typeof entry.score === 'number' ? entry.score : 0,
    position: typeof entry.position === 'number' ? entry.position : 0,
    summary: typeof entry.summary === 'string' ? entry.summary : '',
  }
}

function normalizeSnapshotRankingEntry(value: unknown): RecognitionSnapshotRankingEntry | null {
  const baseEntry = normalizeSnapshotEntry(value)

  if (!baseEntry || !value || typeof value !== 'object') {
    return null
  }

  const entry = value as Record<string, unknown>
  const breakdown =
    entry.breakdownPublic && typeof entry.breakdownPublic === 'object'
      ? (entry.breakdownPublic as Record<string, unknown>)
      : null

  return {
    ...baseEntry,
    breakdownPublic: {
      academyPoints: typeof breakdown?.academyPoints === 'number' ? breakdown.academyPoints : 0,
      taskPoints: typeof breakdown?.taskPoints === 'number' ? breakdown.taskPoints : 0,
      reminderPoints: typeof breakdown?.reminderPoints === 'number' ? breakdown.reminderPoints : 0,
      bonusPoints: typeof breakdown?.bonusPoints === 'number' ? breakdown.bonusPoints : 0,
      salesPoints: typeof breakdown?.salesPoints === 'number' ? breakdown.salesPoints : 0,
      validatedSalesAmount:
        typeof breakdown?.validatedSalesAmount === 'number' ? breakdown.validatedSalesAmount : 0,
      validatedSalesCount:
        typeof breakdown?.validatedSalesCount === 'number' ? breakdown.validatedSalesCount : 0,
      salesBonusPoints:
        typeof breakdown?.salesBonusPoints === 'number' ? breakdown.salesBonusPoints : 0,
    },
  }
}

function mapRecognitionWeeklySnapshotDocument(
  id: string,
  data: DocumentData,
): RecognitionWeeklySnapshot {
  const podium = Array.isArray(data.podium)
    ? data.podium
        .map((entry) => normalizeSnapshotEntry(entry))
        .filter((entry): entry is RecognitionSnapshotEntry => entry !== null)
    : []

  const ranking = Array.isArray(data.ranking)
    ? data.ranking
        .map((entry) => normalizeSnapshotRankingEntry(entry))
        .filter((entry): entry is RecognitionSnapshotRankingEntry => entry !== null)
    : []

  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    weekKey: typeof data.weekKey === 'string' ? data.weekKey : '',
    weekLabel: typeof data.weekLabel === 'string' ? data.weekLabel : '',
    weekStartDate: typeof data.weekStartDate === 'string' ? data.weekStartDate : '',
    weekEndDate: typeof data.weekEndDate === 'string' ? data.weekEndDate : '',
    generatedByUid: typeof data.generatedByUid === 'string' ? data.generatedByUid : '',
    generatedAt: data.generatedAt ?? null,
    podium,
    ranking,
    isPublished: data.isPublished === true,
  }
}

type SnapshotReadContext = {
  teamId: string
  authUid?: string | null
  viewRole?: 'leader' | 'member' | 'none'
}

async function listPublishedSnapshotsByTeamId(teamId: string): Promise<RecognitionWeeklySnapshot[]> {
  const normalizedTeamId = teamId.trim()

  if (!normalizedTeamId) {
    return []
  }

  try {
    const snapshotsQuery = query(
      collection(getFirebaseDb(), COLLECTIONS.recognitionWeeklySnapshots),
      where('teamId', '==', normalizedTeamId),
      where('isPublished', '==', true),
    )
    const snapshot = await getDocs(snapshotsQuery)

    return snapshot.docs
      .map((snapshotDoc) => mapRecognitionWeeklySnapshotDocument(snapshotDoc.id, snapshotDoc.data()))
      .filter((item) => item.isPublished)
  } catch (error) {
    if (isFirebasePermissionDenied(error)) {
      return []
    }

    throw error
  }
}

async function getPublishedSnapshotByPeriod(
  teamId: string,
  period: RecognitionWeekPeriod = getCurrentRecognitionWeekPeriod(),
  context: SnapshotReadContext = { teamId },
): Promise<RecognitionWeeklySnapshot | null> {
  const normalizedTeamId = teamId.trim()

  if (!normalizedTeamId) {
    return null
  }

  const snapshotPaths = buildRecognitionSnapshotDebugPaths(normalizedTeamId, period)

  logRecognitionRankingSourceDebug({
    source: 'snapshot',
    teamId: normalizedTeamId,
    authUid: context.authUid,
    viewRole: context.viewRole ?? 'none',
  })

  try {
    const snapshotDoc = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.recognitionWeeklySnapshots, snapshotPaths.expectedSnapshotId),
    )

    if (!snapshotDoc.exists()) {
      return null
    }

    const snapshot = mapRecognitionWeeklySnapshotDocument(snapshotDoc.id, snapshotDoc.data())

    return snapshot.isPublished ? snapshot : null
  } catch (error) {
    if (isFirebasePermissionDenied(error)) {
      if (import.meta.env.DEV) {
        logRecognitionRankingError({
          error,
          authUid: context.authUid,
          viewRole: context.viewRole ?? 'none',
          teamId: normalizedTeamId,
          period,
          failedStep: 'snapshot.getDoc.missingOrDenied',
        })
      }

      return null
    }

    throw error
  }
}

async function publishWeeklySnapshot(
  input: PublishRecognitionWeeklySnapshotInput,
): Promise<RecognitionWeeklySnapshot> {
  const normalizedTeamId = input.teamId.trim()
  const period: RecognitionWeekPeriod = {
    weekStart: new Date(`${input.weekStartDate}T00:00:00`),
    weekEnd: new Date(`${input.weekEndDate}T23:59:59`),
    weekStartIso: input.weekStartDate,
    weekEndIso: input.weekEndDate,
    label: input.weekLabel,
    startMs: new Date(`${input.weekStartDate}T00:00:00`).getTime(),
    endMs: new Date(`${input.weekEndDate}T23:59:59`).getTime(),
  }

  const snapshotId = buildRecognitionSnapshotDocId(normalizedTeamId, period)
  const payload = {
    teamId: normalizedTeamId,
    weekKey: input.weekKey,
    weekLabel: input.weekLabel,
    weekStartDate: input.weekStartDate,
    weekEndDate: input.weekEndDate,
    generatedByUid: input.generatedByUid,
    generatedAt: serverTimestamp(),
    podium: input.podium,
    ranking: input.ranking,
    isPublished: true,
  }

  await setDoc(doc(getFirebaseDb(), COLLECTIONS.recognitionWeeklySnapshots, snapshotId), payload, {
    merge: true,
  })

  return {
    id: snapshotId,
    ...payload,
    generatedAt: null,
  }
}

export const recognitionWeeklySnapshotService = {
  getPublishedSnapshotByPeriod,
  listPublishedSnapshotsByTeamId,
  publishWeeklySnapshot,
}
