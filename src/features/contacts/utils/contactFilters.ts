import type { Contact, ContactStatus } from '@/features/contacts/types/contact.types'
import { getContactStatusLabel } from '@/features/contacts/utils/contactStatusLabels'

export type ContactStatusFilter = 'all' | ContactStatus

export type ContactLandingFilter = 'all' | string

export type ContactFiltersState = {
  search: string
  status: ContactStatusFilter
  landing: ContactLandingFilter
}

export const DEFAULT_CONTACT_FILTERS: ContactFiltersState = {
  search: '',
  status: 'all',
  landing: 'all',
}

export const CONTACT_STATUS_FILTER_OPTIONS: Array<{
  value: ContactStatusFilter
  label: string
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: getContactStatusLabel('new') },
  { value: 'contacted', label: getContactStatusLabel('contacted') },
  { value: 'following', label: getContactStatusLabel('following') },
  { value: 'interested', label: getContactStatusLabel('interested') },
  { value: 'not_interested', label: getContactStatusLabel('not_interested') },
  { value: 'converted', label: getContactStatusLabel('converted') },
]

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase()
}

function matchesStatusFilter(contact: Contact, status: ContactStatusFilter): boolean {
  if (status === 'all') {
    return true
  }

  return contact.status === status
}

function matchesSearchFilter(contact: Contact, search: string): boolean {
  const normalizedSearch = normalizeSearchValue(search)

  if (!normalizedSearch) {
    return true
  }

  const haystack = [contact.name, contact.whatsapp, contact.interest, contact.message]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedSearch)
}

function matchesLandingFilter(contact: Contact, landing: ContactLandingFilter): boolean {
  if (landing === 'all') {
    return true
  }

  return contact.landingSlug === landing
}

export function getUniqueLandingSlugs(contacts: Contact[]): string[] {
  const slugs = new Set<string>()

  for (const contact of contacts) {
    const slug = contact.landingSlug.trim()
    if (slug) {
      slugs.add(slug)
    }
  }

  return Array.from(slugs).sort((left, right) => left.localeCompare(right, 'es'))
}

export function filterContacts(contacts: Contact[], filters: ContactFiltersState): Contact[] {
  return contacts.filter(
    (contact) =>
      matchesSearchFilter(contact, filters.search) &&
      matchesStatusFilter(contact, filters.status) &&
      matchesLandingFilter(contact, filters.landing),
  )
}

export function hasActiveContactFilters(filters: ContactFiltersState): boolean {
  return (
    filters.search.trim().length > 0 || filters.status !== 'all' || filters.landing !== 'all'
  )
}
