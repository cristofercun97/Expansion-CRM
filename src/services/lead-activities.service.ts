import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { CreateLeadActivityInput, LeadActivity } from '@/types'

function mapLeadActivity(id: string, data: DocumentData): LeadActivity {
  return {
    id,
    prospectId: data.prospectId ?? '',
    leaderId: data.leaderId ?? '',
    type: data.type,
    description: data.description ?? '',
    createdAt: data.createdAt,
    createdBy: data.createdBy ?? '',
  }
}

async function createLeadActivity(data: CreateLeadActivityInput): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.leadActivities), {
    ...data,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

async function getLeadActivitiesByProspectId(prospectId: string): Promise<LeadActivity[]> {
  const activitiesQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.leadActivities),
    where('prospectId', '==', prospectId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(activitiesQuery)

  return snapshot.docs.map((activityDoc) =>
    mapLeadActivity(activityDoc.id, activityDoc.data()),
  )
}

export const leadActivitiesService = {
  createLeadActivity,
  getLeadActivitiesByProspectId,
}
