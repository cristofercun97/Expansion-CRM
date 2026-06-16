import type { Contact } from '@/features/contacts/types/contact.types'

export type RadarPeriod = 'today' | '7d' | '30d' | 'all'

export const DEFAULT_RADAR_PERIOD: RadarPeriod = 'all'

export const RADAR_PERIOD_OPTIONS: Array<{ value: RadarPeriod; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'all', label: 'Todos' },
]

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function getPeriodStart(period: RadarPeriod, referenceDate = new Date()): Date | null {
  const todayStart = startOfDay(referenceDate)

  switch (period) {
    case 'today':
      return todayStart
    case '7d': {
      const start = new Date(todayStart)
      start.setDate(start.getDate() - 6)
      return start
    }
    case '30d': {
      const start = new Date(todayStart)
      start.setDate(start.getDate() - 29)
      return start
    }
    case 'all':
      return null
  }
}

export function filterContactsByPeriod(
  contacts: Contact[],
  period: RadarPeriod,
  referenceDate = new Date(),
): Contact[] {
  const periodStart = getPeriodStart(period, referenceDate)

  if (!periodStart) {
    return contacts
  }

  const startMs = periodStart.getTime()

  return contacts.filter((contact) => {
    if (!contact.createdAt?.toDate) {
      return false
    }

    return contact.createdAt.toDate().getTime() >= startMs
  })
}
