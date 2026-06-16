import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type {
  CreateProspectInput,
  LeadStatus,
  Prospect,
  UpdateProspectInput,
} from '@/types'

function mapProspect(id: string, data: DocumentData): Prospect {
  return {
    id,
    leaderId: data.leaderId ?? '',
    source: data.source ?? '',
    fullName: data.fullName ?? '',
    phone: data.phone ?? '',
    email: data.email,
    city: data.city,
    status: data.status,
    notes: data.notes ?? '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

async function createProspect(data: CreateProspectInput): Promise<string> {
  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.prospects), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

async function getProspectsByLeaderId(leaderId: string): Promise<Prospect[]> {
  const prospectsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.prospects),
    where('leaderId', '==', leaderId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(prospectsQuery)

  return snapshot.docs.map((prospectDoc) => mapProspect(prospectDoc.id, prospectDoc.data()))
}

async function updateProspectStatus(prospectId: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.prospects, prospectId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

async function updateProspect(prospectId: string, data: UpdateProspectInput): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.prospects, prospectId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const prospectsService = {
  createProspect,
  getProspectsByLeaderId,
  updateProspectStatus,
  updateProspect,
}
