import type { Contact } from '@/features/contacts/types/contact.types'

export type ContactKpis = {
  total: number
  new: number
  following: number
  converted: number
}

export function calculateContactKpis(contacts: Contact[]): ContactKpis {
  return contacts.reduce<ContactKpis>(
    (accumulator, contact) => {
      accumulator.total += 1

      if (contact.status === 'new') {
        accumulator.new += 1
      }

      if (contact.status === 'following') {
        accumulator.following += 1
      }

      if (contact.status === 'converted') {
        accumulator.converted += 1
      }

      return accumulator
    },
    { total: 0, new: 0, following: 0, converted: 0 },
  )
}
