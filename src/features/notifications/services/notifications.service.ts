import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import type { AppNotification, AppNotificationType } from '@/features/notifications/types/notification.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapType(value: unknown): AppNotificationType {
  if (
    value === 'meeting_reminder' ||
    value === 'meeting_invitation' ||
    value === 'meeting_rescheduled' ||
    value === 'meeting_cancelled' ||
    value === 'meeting_result_pending' ||
    value === 'public_booking_created'
  ) {
    return value
  }
  return 'meeting_reminder'
}

function mapNotification(id: string, data: DocumentData): AppNotification {
  return {
    id,
    recipientUid: typeof data.recipientUid === 'string' ? data.recipientUid : '',
    type: mapType(data.type),
    title: typeof data.title === 'string' ? data.title : '',
    message: typeof data.message === 'string' ? data.message : '',
    meetingId: typeof data.meetingId === 'string' ? data.meetingId : null,
    contactId: typeof data.contactId === 'string' ? data.contactId : null,
    leadName: typeof data.leadName === 'string' ? data.leadName : null,
    dateLabel: typeof data.dateLabel === 'string' ? data.dateLabel : null,
    timeLabel: typeof data.timeLabel === 'string' ? data.timeLabel : null,
    durationMinutes:
      typeof data.durationMinutes === 'number' && Number.isFinite(data.durationMinutes)
        ? data.durationMinutes
        : null,
    source: typeof data.source === 'string' ? data.source : null,
    actionUrl: typeof data.actionUrl === 'string' ? data.actionUrl : '/dashboard/agenda',
    actionLabel: typeof data.actionLabel === 'string' ? data.actionLabel : 'Ver',
    read: data.read === true,
    createdAt: data.createdAt ?? null,
    readAt: data.readAt ?? null,
  }
}

function myNotificationsQuery(uid: string, max = 40) {
  return query(
    collection(getFirebaseDb(), COLLECTIONS.notifications),
    where('recipientUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
}

async function listMyNotifications(uid: string, max = 40): Promise<AppNotification[]> {
  const snapshot = await getDocs(myNotificationsQuery(uid, max))
  return snapshot.docs.map((item) => mapNotification(item.id, item.data()))
}

function subscribeMyNotifications(
  uid: string,
  onChange: (items: AppNotification[]) => void,
  onError?: (error: Error) => void,
  max = 40,
): Unsubscribe {
  return onSnapshot(
    myNotificationsQuery(uid, max),
    (snapshot) => {
      onChange(snapshot.docs.map((item) => mapNotification(item.id, item.data())))
    },
    (error) => {
      onError?.(error)
    },
  )
}

async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.notifications, notificationId), {
    read: true,
    readAt: serverTimestamp(),
  })
}

export const notificationsService = {
  listMyNotifications,
  subscribeMyNotifications,
  markAsRead,
}
