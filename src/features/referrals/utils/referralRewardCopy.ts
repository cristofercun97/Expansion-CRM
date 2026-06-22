import type { ReferralRewardStatus } from '@/features/referrals/types/referral-reward.types'

export const REFERRAL_REWARDS_PAGE_TITLE = 'Recompensas por recomendación'

export const REFERRAL_REWARDS_PAGE_SUBTITLE =
  'Consulta las recompensas generadas por ventas reales y confirmadas del sistema EXPANSIÓN.'

export const REFERRAL_REWARDS_PAGE_HEADER_CLASS =
  'border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70'

export const REFERRAL_REWARDS_HERO = {
  title: 'Tu programa de recomendación',
  totalGenerated: 'Total generado',
  pending: 'Pendiente de cobro',
  payable: 'Listas para solicitar pago',
  paid: 'Pagado',
} as const

export const REFERRAL_REWARDS_STATUS_COPY: Record<
  ReferralRewardStatus,
  { label: string; description: string }
> = {
  pending: {
    label: 'Pendiente',
    description: 'Recompensa generada recientemente.',
  },
  approved: {
    label: 'Aprobada',
    description: 'Recompensa confirmada.',
  },
  payable: {
    label: 'Lista para pago',
    description: 'Puedes solicitar el retiro desde esta sección.',
  },
  requested: {
    label: 'Solicitud enviada',
    description: 'Recompensas incluidas en una solicitud de pago pendiente de gestión.',
  },
  paid: {
    label: 'Pagada',
    description: 'Recompensas ya pagadas.',
  },
  cancelled: {
    label: 'Cancelada',
    description: 'Recompensas anuladas por cancelación, reembolso o corrección.',
  },
}

export const REFERRAL_REWARDS_LEVEL_SECTION = {
  title: 'Actividad por nivel',
  activePeopleNote:
    'Las personas activas son usuarios que activaron el acceso anual de EXPANSIÓN y generaron una recompensa para ti en ese nivel.',
  perActivation: 'por activación',
  activePeople: 'Personas activas',
  generated: 'Generado',
  paid: 'Pagado',
  pending: 'Pendiente',
} as const

export const REFERRAL_REWARDS_HISTORY = {
  title: 'Historial de recompensas',
  itemDescription: 'Recompensa por activación confirmada del sistema',
  activationConfirmed: 'Activación confirmada',
  empty: 'Aún no hay recompensas registradas.',
} as const

export const REFERRAL_REWARDS_EMPTY = {
  title: 'Aún no tienes recompensas generadas',
  description:
    'Cuando una persona active EXPANSIÓN desde tu invitación y el pago sea confirmado, verás aquí la recompensa correspondiente.',
  shareCta: 'Copiar recomendación',
  activateCta: 'Activar mi organización',
  activateHint: 'Activa tu organización para compartir tu invitación.',
} as const

export const REFERRAL_REWARDS_TRANSPARENCY = {
  title: 'Transparencia del programa',
  body: 'El Programa de Recomendación es opcional. Puedes usar EXPANSIÓN sin recomendar a nadie. Las recompensas solo se generan por ventas reales y confirmadas del acceso anual al sistema. EXPANSIÓN no es una inversión, no promete ingresos y no paga por registros gratuitos ni por invitar personas que no activan el sistema.',
} as const

export const REFERRAL_REWARDS_MI_GRUPO_CTA = 'Ver mis recompensas'
