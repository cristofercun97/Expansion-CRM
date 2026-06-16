import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { Contact, ContactStatus } from '@/features/contacts/types/contact.types'
import type { CreateManualContactInput } from '@/features/contacts/utils/manualContactForm'
import {
  belongsToOwner,
  mapContactDocument,
  sortContactsByCreatedAtDesc,
} from '@/features/contacts/utils/contactMappers'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function mapSnapshotDocs(docs: QueryDocumentSnapshot<DocumentData>[]): Contact[] {
  return docs.map((contactDoc) => mapContactDocument(contactDoc.id, contactDoc.data()))
}

function mergeContacts(contacts: Contact[]): Contact[] {
  const byId = new Map<string, Contact>()

  for (const contact of contacts) {
    byId.set(contact.id, contact)
  }

  return sortContactsByCreatedAtDesc(Array.from(byId.values()))
}

async function getContactsByOwner(uid: string): Promise<Contact[]> {
  const collectionRef = collection(getFirebaseDb(), COLLECTIONS.prospects)

  const [leaderSnapshot, ownerSnapshot] = await Promise.all([
    getDocs(
      query(collectionRef, where('leaderId', '==', uid), orderBy('createdAt', 'desc')),
    ),
    getDocs(query(collectionRef, where('ownerUid', '==', uid))),
  ])

  const contacts = mergeContacts([
    ...mapSnapshotDocs(leaderSnapshot.docs),
    ...mapSnapshotDocs(ownerSnapshot.docs),
  ])

  return contacts.filter((contact) => belongsToOwner(contact, uid))
}

async function updateContactStatus(contactId: string, status: ContactStatus): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.prospects, contactId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

function buildManualContactDocument(uid: string, data: CreateManualContactInput) {
  const document: Record<string, string> = {
    ownerUid: uid,
    leaderId: uid,
    landingSlug: 'manual',
    source: 'manual_contact',
    name: data.name.trim(),
    whatsapp: data.whatsapp.trim(),
    status: data.status ?? 'new',
  }

  if (data.interest !== undefined) {
    document.interest = data.interest.trim()
  }

  if (data.message !== undefined) {
    document.message = data.message.trim()
  }

  return {
    ...document,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

async function createManualContact(uid: string, data: CreateManualContactInput): Promise<Contact> {
  const docRef = await addDoc(
    collection(getFirebaseDb(), COLLECTIONS.prospects),
    buildManualContactDocument(uid, data),
  )

  const now = Timestamp.now()

  return {
    id: docRef.id,
    ownerUid: uid,
    leaderId: uid,
    name: data.name.trim(),
    whatsapp: data.whatsapp.trim(),
    interest: data.interest?.trim() ?? '',
    message: data.message?.trim() ?? '',
    status: data.status ?? 'new',
    landingSlug: 'manual',
    source: 'manual_contact',
    createdAt: now,
    updatedAt: now,
  }
}

export const contactsService = {
  getContactsByOwner,
  updateContactStatus,
  createManualContact,
}
