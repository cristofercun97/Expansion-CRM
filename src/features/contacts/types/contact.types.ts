export type ContactStatus =
  | 'new'
  | 'contacted'
  | 'following'
  | 'interested'
  | 'not_interested'
  | 'converted'

export type Contact = {
  id: string
  ownerUid: string
  leaderId: string
  name: string
  whatsapp: string
  interest: string
  message: string
  status: ContactStatus
  landingSlug: string
  source: string
  createdAt: import('firebase/firestore').Timestamp | null
  updatedAt: import('firebase/firestore').Timestamp | null
}
