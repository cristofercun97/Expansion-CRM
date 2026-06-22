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
import { FirebaseError } from 'firebase/app'
import type {
  ActionTaskProgress,
  ActionTaskStatus,
  UpsertActionTaskProgressInput,
} from '@/features/action-plan/types/action-plan.types'
import {
  buildActionTaskProgressDocumentId,
  logActionTaskProgressDebug,
  type ActionTaskProgressDebugContext,
} from '@/features/action-plan/utils/actionTaskProgressDebug'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapActionTaskProgress(id: string, data: DocumentData): ActionTaskProgress | null {
  const status =
    data.status === 'pending' || data.status === 'in_progress' || data.status === 'completed'
      ? data.status
      : null

  if (
    typeof data.taskId !== 'string' ||
    data.taskId.length === 0 ||
    typeof data.teamId !== 'string' ||
    data.teamId.length === 0 ||
    typeof data.memberUid !== 'string' ||
    data.memberUid.length === 0 ||
    !status
  ) {
    return null
  }

  return {
    id,
    taskId: data.taskId,
    teamId: data.teamId,
    memberUid: data.memberUid,
    memberName: typeof data.memberName === 'string' ? data.memberName : '',
    memberEmail: typeof data.memberEmail === 'string' ? data.memberEmail : '',
    status,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

async function getMyProgressByTeamId(
  teamId: string,
  memberUid: string,
): Promise<ActionTaskProgress[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.actionTaskProgress),
      where('teamId', '==', teamId),
      where('memberUid', '==', memberUid),
    ),
  )

  return snapshot.docs
    .map((progressDoc) => mapActionTaskProgress(progressDoc.id, progressDoc.data()))
    .filter((progress): progress is ActionTaskProgress => progress !== null)
}

async function getProgressByTeamId(teamId: string): Promise<ActionTaskProgress[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.actionTaskProgress),
      where('teamId', '==', teamId),
    ),
  )

  return snapshot.docs
    .map((progressDoc) => mapActionTaskProgress(progressDoc.id, progressDoc.data()))
    .filter((progress): progress is ActionTaskProgress => progress !== null)
}

async function getMyTaskProgress(
  taskId: string,
  memberUid: string,
): Promise<ActionTaskProgress | null> {
  const progressId = buildActionTaskProgressDocumentId(taskId, memberUid)
  const snapshot = await getDoc(
    doc(getFirebaseDb(), COLLECTIONS.actionTaskProgress, progressId),
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapActionTaskProgress(snapshot.id, snapshot.data())
}

type UpsertMyTaskProgressResult = {
  progress: ActionTaskProgress
  tracked: boolean
}

async function upsertMyTaskProgress(
  input: UpsertActionTaskProgressInput,
  debugContext?: ActionTaskProgressDebugContext,
): Promise<UpsertMyTaskProgressResult> {
  const taskId = input.taskId.trim()
  const teamId = input.teamId.trim()
  const memberUid = input.memberUid.trim()
  const memberName = input.memberName.trim() || 'Usuario'
  const memberEmail = input.memberEmail.trim()
  const progressDocId = buildActionTaskProgressDocumentId(taskId, memberUid)
  const progressRef = doc(getFirebaseDb(), COLLECTIONS.actionTaskProgress, progressDocId)
  const now = serverTimestamp()
  const expectedTeamMemberDocId = `${teamId}_${memberUid}`

  if (debugContext) {
    logActionTaskProgressDebug(debugContext)
  }

  if (!taskId || !teamId || !memberUid || !memberEmail) {
    if (import.meta.env.DEV) {
      console.warn('[ActionPlan Progress Debug] Tracking omitido por datos incompletos', {
        taskId,
        teamId,
        memberUid,
        memberEmail,
      })
    }
    return {
      progress: {
        id: progressDocId,
        taskId,
        teamId,
        memberUid,
        memberName,
        memberEmail,
        status: input.status,
        createdAt: null,
        updatedAt: null,
      },
      tracked: false,
    }
  }

  const payloadAttempted = {
    taskId,
    teamId,
    memberUid,
    memberName,
    memberEmail,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await setDoc(progressRef, payloadAttempted, { merge: true })

    return {
      tracked: true,
      progress: {
        id: progressDocId,
        taskId,
        teamId,
        memberUid,
        memberName,
        memberEmail,
        status: input.status,
        createdAt: null,
        updatedAt: null,
      },
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[ActionPlan Progress Error JSON]',
        JSON.stringify(
          {
            errorCode: error instanceof FirebaseError ? error.code : 'unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            progressDocId,
            payloadAttempted: {
              taskId,
              teamId,
              memberUid,
              memberName,
              memberEmail,
              status: input.status,
              createdAt: 'serverTimestamp()',
              updatedAt: 'serverTimestamp()',
            },
            expectedTeamMemberDocId,
            authUid: debugContext?.authUid ?? memberUid,
            emailVerified: debugContext?.emailVerified ?? false,
            taskId,
            taskTeamId: debugContext?.taskTeamId ?? teamId,
            memberUid,
            nextStatus: input.status,
          },
          null,
          2,
        ),
      )
    }

    throw error
  }
}

export const actionTaskProgressService = {
  getProgressByTeamId,
  getMyProgressByTeamId,
  getMyTaskProgress,
  upsertMyTaskProgress,
}

export type { ActionTaskStatus }
