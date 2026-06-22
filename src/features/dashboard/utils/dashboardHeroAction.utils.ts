import type { LucideIcon } from 'lucide-react'
import { ClipboardList, Target, UsersRound } from 'lucide-react'
import type {
  DashboardOverviewData,
  DashboardScopedOverview,
} from '@/features/dashboard/types/dashboard-overview.types'

export type DashboardHeroPrimaryAction = {
  label: string
  href: string
  icon: LucideIcon
}

export function resolveHeroPrimaryAction(
  scoped: DashboardScopedOverview,
  overview: DashboardOverviewData,
): DashboardHeroPrimaryAction | null {
  const goal = scoped.commercialGoal
  const highAttention = scoped.attentionItems.find(
    (item) => item.isVisible && item.count > 0 && item.priority === 'high',
  )

  if (scoped.sales.pendingSalesCount > 0) {
    return {
      label: 'Validar ventas',
      href: '/dashboard/progreso-equipo',
      icon: Target,
    }
  }

  if (goal.status === 'at_risk') {
    return {
      label: 'Enfocar equipo',
      href: '/dashboard/progreso-equipo',
      icon: UsersRound,
    }
  }

  if (goal.status === 'needs_attention') {
    return {
      label: 'Revisar plan',
      href: '/dashboard/plan',
      icon: ClipboardList,
    }
  }

  if (highAttention?.type === 'unread_reminders') {
    return {
      label: 'Revisar recordatorios',
      href: highAttention.href,
      icon: ClipboardList,
    }
  }

  if (highAttention?.type === 'pending_sales') {
    return {
      label: 'Validar ventas',
      href: highAttention.href,
      icon: Target,
    }
  }

  if (goal.status !== 'no_goal' && goal.status !== 'completed') {
    return {
      label: 'Revisar plan',
      href: '/dashboard/plan',
      icon: ClipboardList,
    }
  }

  if (overview.userProfile.hasActiveOwnedOrganization) {
    return {
      label: 'Ver progreso',
      href: '/dashboard/progreso-equipo',
      icon: UsersRound,
    }
  }

  return null
}

export function resolveHeroSecondaryAction(
  scoped: DashboardScopedOverview,
  primary: DashboardHeroPrimaryAction | null,
): { label: string; href: string } | null {
  const reminders = scoped.attentionItems.find(
    (item) => item.type === 'unread_reminders' && item.isVisible && item.count > 0,
  )

  if (reminders && primary?.label !== 'Revisar recordatorios') {
    return {
      label: 'Revisar recordatorios',
      href: reminders.href,
    }
  }

  if (
    scoped.sales.pendingSalesCount > 0 &&
    primary?.label !== 'Validar ventas'
  ) {
    return {
      label: 'Validar ventas',
      href: '/dashboard/progreso-equipo',
    }
  }

  return null
}
