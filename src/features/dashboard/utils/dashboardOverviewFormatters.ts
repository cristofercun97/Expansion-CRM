import type { Timestamp } from 'firebase/firestore'
import type { DashboardCommercialGoalStatus } from '@/features/dashboard/types/dashboard-overview.types'

export function formatDashboardCurrency(amount: number, currency = 'EUR'): string {
  const locale = currency === 'USD' ? 'en-US' : 'es-ES'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDashboardRelativeDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  const date = timestamp.toDate()
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return 'Hoy'
  }

  if (diffDays === 1) {
    return 'Ayer'
  }

  if (diffDays < 7) {
    return `Hace ${diffDays} días`
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

export function getCommercialGoalStatusLabel(status: DashboardCommercialGoalStatus): string {
  switch (status) {
    case 'completed':
      return 'Completado'
    case 'at_risk':
      return 'En riesgo'
    case 'needs_attention':
      return 'Requiere atención'
    case 'on_track':
      return 'En marcha'
    default:
      return 'Sin objetivo'
  }
}

export function getCommercialGoalStatusClass(status: DashboardCommercialGoalStatus): string {
  switch (status) {
    case 'completed':
      return 'border-teal-accent/30 bg-teal-accent/15 text-teal-accent'
    case 'at_risk':
      return 'border-amber-400/35 bg-amber-400/12 text-amber-100'
    case 'needs_attention':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-100'
    case 'on_track':
      return 'border-gold/30 bg-gold/15 text-gold-light'
    default:
      return 'border-white/15 bg-white/5 text-hero-text/70'
  }
}
