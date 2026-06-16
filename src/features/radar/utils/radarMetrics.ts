import type { Contact } from '@/features/contacts/types/contact.types'
import { calculateContactKpis, type ContactKpis } from '@/features/contacts/utils/contactKpis'

export type RadarRankedItem = {
  label: string
  count: number
}

export type RadarMetrics = {
  kpis: ContactKpis
  topInterests: RadarRankedItem[]
  topLandings: RadarRankedItem[]
  topInterest: string | null
  topLanding: string | null
  summary: string
}

const EMPTY_DATA_LABEL = 'Sin datos todavía'
const MAX_RANKED_ITEMS = 5

function countFieldValues(
  contacts: Contact[],
  getValue: (contact: Contact) => string,
): RadarRankedItem[] {
  const counts = new Map<string, number>()

  for (const contact of contacts) {
    const value = getValue(contact).trim()

    if (!value) {
      continue
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'es'))
}

export function formatRadarLandingSlug(slug: string): string {
  if (slug === 'manual') {
    return 'Contactos manuales'
  }

  return slug
}

function buildRadarSummary(contacts: Contact[], topInterest: string | null): string {
  if (contacts.length === 0) {
    return 'Aún no hay suficiente información. Comparte tu presentación para empezar a medir el interés.'
  }

  if (!topInterest) {
    return 'Ya tienes contactos registrados. Revisa sus perfiles y prioriza el seguimiento.'
  }

  return `Tu mayor interés actualmente es: ${topInterest}. Revisa estos contactos y prioriza el seguimiento.`
}

export function calculateRadarMetrics(contacts: Contact[]): RadarMetrics {
  const kpis = calculateContactKpis(contacts)
  const topInterests = countFieldValues(contacts, (contact) => contact.interest).slice(
    0,
    MAX_RANKED_ITEMS,
  )
  const topLandings = countFieldValues(contacts, (contact) => contact.landingSlug)
    .map((item) => ({
      ...item,
      label: formatRadarLandingSlug(item.label),
    }))
    .slice(0, MAX_RANKED_ITEMS)

  const topInterest = topInterests[0]?.label ?? null
  const topLanding = topLandings[0]?.label ?? null

  return {
    kpis,
    topInterests,
    topLandings,
    topInterest,
    topLanding,
    summary: buildRadarSummary(contacts, topInterest),
  }
}

export function getRadarHighlightLabel(value: string | null): string {
  return value ?? EMPTY_DATA_LABEL
}

export { EMPTY_DATA_LABEL }
