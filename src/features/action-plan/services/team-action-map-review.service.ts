import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  CreateTeamActionMapReviewInput,
  TeamActionMapReview,
  TeamActionMapReviewWeeklyStatus,
  UpdateTeamActionMapReviewInput,
} from '@/features/action-plan/types/team-action-map-review.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function normalizeWeeklyStatus(value: unknown): TeamActionMapReviewWeeklyStatus {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value
  }

  return 'yellow'
}

function normalizeDateValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapTeamActionMapReviewDocument(id: string, data: DocumentData): TeamActionMapReview {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    roadmapId: typeof data.roadmapId === 'string' ? data.roadmapId : '',
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    weekLabel: typeof data.weekLabel === 'string' ? data.weekLabel : '',
    weekStartDate: normalizeDateValue(data.weekStartDate),
    weekEndDate: normalizeDateValue(data.weekEndDate),
    progressSummary: typeof data.progressSummary === 'string' ? data.progressSummary : '',
    blockers: typeof data.blockers === 'string' ? data.blockers : '',
    nextAdjustments: typeof data.nextAdjustments === 'string' ? data.nextAdjustments : '',
    weeklyStatus: normalizeWeeklyStatus(data.weeklyStatus),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function sortReviewsByCreatedAtDesc(reviews: TeamActionMapReview[]): TeamActionMapReview[] {
  return [...reviews].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): TeamActionMapReview[] {
  return docs.map((reviewDoc) => mapTeamActionMapReviewDocument(reviewDoc.id, reviewDoc.data()))
}

function buildReviewPayload(
  input: CreateTeamActionMapReviewInput | UpdateTeamActionMapReviewInput,
): Record<string, unknown> {
  return {
    weekLabel: input.weekLabel.trim(),
    weekStartDate: normalizeDateValue(input.weekStartDate),
    weekEndDate: normalizeDateValue(input.weekEndDate),
    progressSummary: input.progressSummary.trim(),
    blockers: input.blockers.trim(),
    nextAdjustments: input.nextAdjustments.trim(),
    weeklyStatus: input.weeklyStatus,
    updatedAt: serverTimestamp(),
  }
}

async function getTeamActionMapReviews(teamId: string): Promise<TeamActionMapReview[]> {
  const normalizedTeamId = teamId.trim()

  if (!normalizedTeamId) {
    return []
  }

  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.teamActionMapReviews),
      where('teamId', '==', normalizedTeamId),
    ),
  )

  return sortReviewsByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function getLatestTeamActionMapReview(teamId: string): Promise<TeamActionMapReview | null> {
  const reviews = await getTeamActionMapReviews(teamId)
  return reviews[0] ?? null
}

async function createTeamActionMapReview(
  input: CreateTeamActionMapReviewInput,
): Promise<string> {
  const normalizedTeamId = input.teamId.trim()
  const payload = {
    teamId: normalizedTeamId,
    roadmapId: input.roadmapId.trim() || normalizedTeamId,
    ownerUid: input.ownerUid.trim(),
    ...buildReviewPayload(input),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(
    collection(getFirebaseDb(), COLLECTIONS.teamActionMapReviews),
    payload,
  )

  return docRef.id
}

async function updateTeamActionMapReview(
  reviewId: string,
  input: UpdateTeamActionMapReviewInput,
): Promise<void> {
  const normalizedReviewId = reviewId.trim()

  if (!normalizedReviewId) {
    throw new Error('Review id is required.')
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.teamActionMapReviews, normalizedReviewId), {
    ...buildReviewPayload(input),
  })
}

export const teamActionMapReviewService = {
  getTeamActionMapReviews,
  getLatestTeamActionMapReview,
  createTeamActionMapReview,
  updateTeamActionMapReview,
}
