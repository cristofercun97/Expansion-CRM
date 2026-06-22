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
import { mergeManagedTeamTasks } from '@/features/action-plan/utils/actionPlanTeamAccess'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapDueDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function mapOptionalDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function mapOptionalString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  return value.trim()
}

function mapResponsibleType(value: unknown): ActionTask['responsibleType'] {
  if (value === 'all' || value === 'leader' || value === 'member') {
    return value
  }

  return null
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

  const teamId =
    typeof data.teamId === 'string' && data.teamId.trim().length > 0 ? data.teamId.trim() : null

  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    teamId,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    status,
    priority,
    dueDate: mapDueDate(data.dueDate),
    roadmapId: mapOptionalString(data.roadmapId),
    roadmapTeamId: mapOptionalString(data.roadmapTeamId),
    areaId: mapOptionalString(data.areaId),
    areaTitle: mapOptionalString(data.areaTitle),
    responsibleType: mapResponsibleType(data.responsibleType),
    responsibleUid: mapOptionalString(data.responsibleUid),
    responsibleName: mapOptionalString(data.responsibleName),
    startDate: mapOptionalDate(data.startDate),
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

async function getTasksByTeamId(teamId: string): Promise<ActionTask[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.actionTasks)
  const snapshot = await getDocs(query(collectionRef, where('teamId', '==', teamId)))

  return sortTasksByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function getManagedTasks(ownerUid: string, ownedTeamId: string): Promise<ActionTask[]> {
  const [teamTasks, ownerTasks] = await Promise.all([
    getTasksByTeamId(ownedTeamId),
    getTasksByOwner(ownerUid),
  ])

  return mergeManagedTeamTasks(teamTasks, ownerTasks, ownerUid, ownedTeamId)
}

async function createTask(uid: string, data: CreateActionTaskInput): Promise<ActionTask> {
  return createTeamTask(uid, null, data)
}

async function createTeamTask(
  uid: string,
  ownedTeamId: string | null,
  data: CreateActionTaskInput,
): Promise<ActionTask> {
  const dueDate = data.dueDate?.trim() ?? ''
  const startDate = data.startDate?.trim() ?? ''
  const payload: Record<string, unknown> = {
    ownerUid: uid,
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status,
    priority: data.priority,
    dueDate,
    startDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (ownedTeamId) {
    payload.teamId = ownedTeamId
  }

  if (data.roadmapId?.trim()) {
    payload.roadmapId = data.roadmapId.trim()
  }

  if (data.roadmapTeamId?.trim()) {
    payload.roadmapTeamId = data.roadmapTeamId.trim()
  }

  if (data.areaId?.trim()) {
    payload.areaId = data.areaId.trim()
  }

  if (data.areaTitle?.trim()) {
    payload.areaTitle = data.areaTitle.trim()
  }

  if (data.responsibleType) {
    payload.responsibleType = data.responsibleType
    payload.responsibleUid = data.responsibleUid?.trim() ?? ''
    payload.responsibleName = data.responsibleName?.trim() ?? ''
  }

  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.actionTasks), payload)
  const now = Timestamp.now()

  return {
    id: docRef.id,
    ownerUid: uid,
    teamId: ownedTeamId,
    title: data.title.trim(),
    description: data.description.trim(),
    status: data.status,
    priority: data.priority,
    dueDate: dueDate || null,
    startDate: startDate || null,
    roadmapId: data.roadmapId?.trim() ?? null,
    roadmapTeamId: data.roadmapTeamId?.trim() ?? null,
    areaId: data.areaId?.trim() ?? null,
    areaTitle: data.areaTitle?.trim() ?? null,
    responsibleType: data.responsibleType ?? null,
    responsibleUid: data.responsibleUid?.trim() ?? null,
    responsibleName: data.responsibleName?.trim() ?? null,
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

async function associateLegacyTaskWithTeam(taskId: string, ownedTeamId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.actionTasks, taskId), {
    teamId: ownedTeamId,
    updatedAt: serverTimestamp(),
  })
}

async function associateLegacyTasksWithTeam(
  ownerUid: string,
  ownedTeamId: string,
): Promise<void> {
  const ownerTasks = await getTasksByOwner(ownerUid)
  const legacyTasks = ownerTasks.filter((task) => !task.teamId)

  await Promise.all(
    legacyTasks.map((task) => associateLegacyTaskWithTeam(task.id, ownedTeamId)),
  )
}

export const actionPlanService = {
  getTasksByOwner,
  getTasksByTeamId,
  getManagedTasks,
  createTask,
  createTeamTask,
  updateTaskStatus,
  associateLegacyTasksWithTeam,
}
