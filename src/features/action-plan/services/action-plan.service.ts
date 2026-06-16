import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  ActionTask,
  ActionTaskStatus,
  CreateActionTaskInput,
} from '@/features/action-plan/types/action-plan.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapDueDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function mapActionTaskDocument(id: string, data: DocumentData): ActionTask {
  const status =
    data.status === 'pending' || data.status === 'in_progress' || data.status === 'completed'
      ? data.status
      : 'pending'

  const priority =
    data.priority === 'low' || data.priority === 'medium' || data.priority === 'high'
      ? data.priority
      : 'medium'

  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    status,
    priority,
    dueDate: mapDueDate(data.dueDate),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function sortTasksByCreatedAtDesc(tasks: ActionTask[]): ActionTask[] {
  return [...tasks].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): ActionTask[] {
  return docs.map((taskDoc) => mapActionTaskDocument(taskDoc.id, taskDoc.data()))
}

async function getTasksByOwner(uid: string): Promise<ActionTask[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.actionTasks)
  const snapshot = await getDocs(query(collectionRef, where('ownerUid', '==', uid)))

  return sortTasksByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function createTask(uid: string, data: CreateActionTaskInput): Promise<ActionTask> {
  const dueDate = data.dueDate?.trim() ?? ''

  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.actionTasks), {
    ownerUid: uid,
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status,
    priority: data.priority,
    dueDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const now = Timestamp.now()

  return {
    id: docRef.id,
    ownerUid: uid,
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status,
    priority: data.priority,
    dueDate: dueDate || null,
    createdAt: now,
    updatedAt: now,
  }
}

async function updateTaskStatus(taskId: string, status: ActionTaskStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.actionTasks, taskId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export const actionPlanService = {
  getTasksByOwner,
  createTask,
  updateTaskStatus,
}
