import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import type {
  CreateTeamRecognitionInput,
  TeamRecognition,
  TeamRecognitionType,
  TeamRecognitionVisibility,
} from '@/features/recognitions/types/team-recognition.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

const RECOGNITIONS_FETCH_LIMIT = 20

function normalizeTeamRecognitionType(value: unknown): TeamRecognitionType {
  const allowed: TeamRecognitionType[] = [
    'commitment',
    'consistency',
    'attitude',
    'training',
    'leadership',
    'progress',
    'team_spirit',
  ]

  return allowed.includes(value as TeamRecognitionType)
    ? (value as TeamRecognitionType)
    : 'commitment'
}

function normalizeTeamRecognitionVisibility(value: unknown): TeamRecognitionVisibility {
  return value === 'private' ? 'private' : 'team'
}

function mapTeamRecognitionDocument(id: string, data: DocumentData): TeamRecognition {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    senderUid: typeof data.senderUid === 'string' ? data.senderUid : '',
    senderName: typeof data.senderName === 'string' ? data.senderName : '',
    recipientUid: typeof data.recipientUid === 'string' ? data.recipientUid : '',
    recipientName: typeof data.recipientName === 'string' ? data.recipientName : '',
    recipientEmail:
      typeof data.recipientEmail === 'string' && data.recipientEmail.trim().length > 0
        ? data.recipientEmail.trim()
        : null,
    type: normalizeTeamRecognitionType(data.type),
    title: typeof data.title === 'string' ? data.title : '',
    message: typeof data.message === 'string' ? data.message : '',
    visibility: normalizeTeamRecognitionVisibility(data.visibility),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function sortRecognitionsByCreatedAtDesc(recognitions: TeamRecognition[]): TeamRecognition[] {
  return [...recognitions].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

async function queryLeaderTeamRecognitions(teamId: string): Promise<TeamRecognition[]> {
  const recognitionsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamRecognitions),
    where('teamId', '==', teamId),
    orderBy('createdAt', 'desc'),
    limit(RECOGNITIONS_FETCH_LIMIT),
  )

  const snapshot = await getDocs(recognitionsQuery)
  return snapshot.docs.map((recognitionDoc) =>
    mapTeamRecognitionDocument(recognitionDoc.id, recognitionDoc.data()),
  )
}

async function queryMemberTeamRecognitions(
  teamId: string,
  viewerUid: string,
): Promise<TeamRecognition[]> {
  const [teamVisibleSnapshot, personalSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(getFirebaseDb(), COLLECTIONS.teamRecognitions),
        where('teamId', '==', teamId),
        where('visibility', '==', 'team'),
        orderBy('createdAt', 'desc'),
        limit(RECOGNITIONS_FETCH_LIMIT),
      ),
    ),
    getDocs(
      query(
        collection(getFirebaseDb(), COLLECTIONS.teamRecognitions),
        where('teamId', '==', teamId),
        where('recipientUid', '==', viewerUid),
        orderBy('createdAt', 'desc'),
        limit(RECOGNITIONS_FETCH_LIMIT),
      ),
    ),
  ])

  const merged = new Map<string, TeamRecognition>()

  for (const recognitionDoc of [...teamVisibleSnapshot.docs, ...personalSnapshot.docs]) {
    merged.set(
      recognitionDoc.id,
      mapTeamRecognitionDocument(recognitionDoc.id, recognitionDoc.data()),
    )
  }

  return sortRecognitionsByCreatedAtDesc([...merged.values()]).slice(0, RECOGNITIONS_FETCH_LIMIT)
}

async function getTeamRecognitions(
  teamId: string,
  viewerUid: string,
  viewRole: RecognitionsViewRole,
): Promise<TeamRecognition[]> {
  const normalizedTeamId = teamId.trim()
  const normalizedViewerUid = viewerUid.trim()

  if (!normalizedTeamId || !normalizedViewerUid) {
    return []
  }

  if (viewRole === 'leader') {
    return queryLeaderTeamRecognitions(normalizedTeamId)
  }

  if (viewRole === 'member') {
    return queryMemberTeamRecognitions(normalizedTeamId, normalizedViewerUid)
  }

  return []
}

async function createTeamRecognition(input: CreateTeamRecognitionInput): Promise<TeamRecognition> {
  const payload = {
    teamId: input.teamId.trim(),
    senderUid: input.senderUid.trim(),
    senderName: input.senderName.trim(),
    recipientUid: input.recipientUid.trim(),
    recipientName: input.recipientName.trim(),
    recipientEmail: input.recipientEmail?.trim() || null,
    type: input.type,
    title: input.title.trim(),
    message: input.message.trim(),
    visibility: input.visibility,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const createdDoc = await addDoc(
    collection(getFirebaseDb(), COLLECTIONS.teamRecognitions),
    payload,
  )

  return {
    id: createdDoc.id,
    ...payload,
    createdAt: null,
    updatedAt: null,
  }
}

export const teamRecognitionService = {
  getTeamRecognitions,
  createTeamRecognition,
}
