import type { ContactStatus } from '@/features/contacts/types/contact.types'

const STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  following: 'En seguimiento',
  interested: 'Interesado',
  not_interested: 'No interesado',
  converted: 'Convertido',
}

export function getContactStatusLabel(status: ContactStatus): string {
  return STATUS_LABELS[status] ?? 'Nuevo'
}

export const CONTACT_STATUS_OPTIONS: Array<{ value: ContactStatus; label: string }> = [
  { value: 'new', label: STATUS_LABELS.new },
  { value: 'contacted', label: STATUS_LABELS.contacted },
  { value: 'following', label: STATUS_LABELS.following },
  { value: 'interested', label: STATUS_LABELS.interested },
  { value: 'not_interested', label: STATUS_LABELS.not_interested },
  { value: 'converted', label: STATUS_LABELS.converted },
]
