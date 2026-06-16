import type { DocumentData } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import type { Contact, ContactStatus } from '@/features/contacts/types/contact.types'

const OFFICIAL_STATUSES: ContactStatus[] = [
  'new',
  'contacted',
  'following',
  'interested',
  'not_interested',
  'converted',
]

export function normalizeContactStatus(value: unknown): ContactStatus {
  if (typeof value !== 'string') {
    return 'new'
  }

  if (OFFICIAL_STATUSES.includes(value as ContactStatus)) {
    return value as ContactStatus
  }

  switch (value) {
    case 'lost':
      return 'not_interested'
    case 'registered':
    case 'active':
      return 'converted'
    default:
      return 'new'
  }
}

function readTimestamp(value: unknown): Timestamp | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value as Timestamp
  }

  return null
}

export function mapContactDocument(id: string, data: DocumentData): Contact {
  return {
    id,
    ownerUid: String(data.ownerUid ?? ''),
    leaderId: String(data.leaderId ?? ''),
    name: String(data.name ?? data.fullName ?? '').trim(),
    whatsapp: String(data.whatsapp ?? data.phone ?? '').trim(),
    interest: String(data.interest ?? '').trim(),
    message: String(data.message ?? data.notes ?? '').trim(),
    status: normalizeContactStatus(data.status),
    landingSlug: String(data.landingSlug ?? '').trim(),
    source: String(data.source ?? '').trim(),
    createdAt: readTimestamp(data.createdAt),
    updatedAt: readTimestamp(data.updatedAt),
  }
}

export function belongsToOwner(contact: Contact, uid: string): boolean {
  return contact.ownerUid === uid || contact.leaderId === uid
}

export function sortContactsByCreatedAtDesc(contacts: Contact[]): Contact[] {
  return [...contacts].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}
