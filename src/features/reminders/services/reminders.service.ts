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
  CreateTeamReminderInput,
  TeamReminder,
  TeamReminderRelatedContext,
  TeamReminderStatus,
  TeamReminderType,
} from '@/features/reminders/types/reminder.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapRelatedContext(value: unknown): TeamReminderRelatedContext | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const context = value as Record<string, unknown>
  const source =
    context.source === 'team_progress' ||
    context.source === 'academy' ||
    context.source === 'action_plan' ||
    context.source === 'sales_goal'
      ? context.source
      : null

  if (!source) {
    return undefined
  }

  const priority =
    context.priority === 'high' || context.priority === 'medium' || context.priority === 'low'
      ? context.priority
      : undefined

  const salesReportId =
    typeof context.salesReportId === 'string' && context.salesReportId.trim().length > 0
      ? context.salesReportId.trim()
      : undefined
  const goalId =
    typeof context.goalId === 'string' && context.goalId.trim().length > 0
      ? context.goalId.trim()
      : undefined
  const amount = typeof context.amount === 'number' ? context.amount : undefined
  const currency =
    typeof context.currency === 'string' && context.currency.trim().length > 0
      ? context.currency.trim()
      : undefined
  const memberUid =
    typeof context.memberUid === 'string' && context.memberUid.trim().length > 0
      ? context.memberUid.trim()
      : undefined
  const ctaPath =
    typeof context.ctaPath === 'string' && context.ctaPath.trim().length > 0
      ? context.ctaPath.trim()
      : undefined

  return {
    source,
    ...(priority ? { priority } : {}),
    ...(salesReportId ? { salesReportId } : {}),
    ...(goalId ? { goalId } : {}),
    ...(amount !== undefined ? { amount } : {}),
    ...(currency ? { currency } : {}),
    ...(memberUid ? { memberUid } : {}),
    ...(ctaPath ? { ctaPath } : {}),
  }
}

function mapReminderDocument(id: string, data: DocumentData): TeamReminder {
  const type: TeamReminderType =
    data.type === 'follow_up' ||
    data.type === 'task' ||
    data.type === 'academy' ||
    data.type === 'recognition' ||
    data.type === 'sales_report'
      ? data.type
      : 'follow_up'

  const status: TeamReminderStatus = data.status === 'read' ? 'read' : 'unread'

  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    senderUid: typeof data.senderUid === 'string' ? data.senderUid : '',
    senderName: typeof data.senderName === 'string' ? data.senderName : '',
    recipientUid: typeof data.recipientUid === 'string' ? data.recipientUid : '',
    recipientName: typeof data.recipientName === 'string' ? data.recipientName : '',
    recipientEmail: typeof data.recipientEmail === 'string' ? data.recipientEmail : '',
    title: typeof data.title === 'string' ? data.title : '',
    message: typeof data.message === 'string' ? data.message : '',
    type,
    status,
    createdAt: data.createdAt ?? null,
    readAt: data.readAt ?? null,
    relatedContext: mapRelatedContext(data.relatedContext),
  }
}

function sortRemindersByCreatedAtDesc(reminders: TeamReminder[]): TeamReminder[] {
  return [...reminders].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): TeamReminder[] {
  return docs.map((reminderDoc) => mapReminderDocument(reminderDoc.id, reminderDoc.data()))
}

async function createTeamReminder(input: CreateTeamReminderInput): Promise<string> {
  const payload: Record<string, unknown> = {
    teamId: input.teamId,
    senderUid: input.senderUid,
    senderName: input.senderName,
    recipientUid: input.recipientUid,
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    title: input.title.trim(),
    message: input.message.trim(),
    type: input.type,
    status: 'unread',
    createdAt: serverTimestamp(),
  }

  if (input.relatedContext) {
    payload.relatedContext = input.relatedContext
  }

  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.teamReminders), payload)
  return docRef.id
}

async function getMyReminders(uid: string): Promise<TeamReminder[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.teamReminders),
      where('recipientUid', '==', uid),
    ),
  )

  return sortRemindersByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function getTeamReminders(teamId: string): Promise<TeamReminder[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), COLLECTIONS.teamReminders), where('teamId', '==', teamId)),
  )

  return sortRemindersByCreatedAtDesc(mapSnapshotDocs(snapshot.docs))
}

async function markReminderAsRead(reminderId: string, _uid: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.teamReminders, reminderId), {
    status: 'read',
    readAt: serverTimestamp(),
  })
}

export const remindersService = {
  createTeamReminder,
  getMyReminders,
  getTeamReminders,
  markReminderAsRead,
}
