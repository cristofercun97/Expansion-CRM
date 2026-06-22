import type {
  DashboardAttentionItem,
  DashboardAttentionItemType,
  DashboardOverviewData,
} from '@/features/dashboard/types/dashboard-overview.types'
import { formatDashboardCurrency } from '@/features/dashboard/utils/dashboardOverviewFormatters'
import { getAttentionActionLabel } from '@/features/dashboard/utils/dashboardOverviewMicrocopy'

export type DashboardNextBestActionPriority = 'high' | 'medium' | 'low' | 'calm'

export type DashboardNextBestAction = {
  title: string
  message: string
  ctaLabel: string
  href: string
  priority: DashboardNextBestActionPriority
}

function buildAttentionNextActionMessage(item: DashboardAttentionItem): string {
  const count = item.count

  switch (item.type) {
    case 'unread_reminders':
      return `Hay ${count} mensaje${count === 1 ? '' : 's'} del grupo esperando tu revisión.`
    case 'pending_sales':
      return `Revisa las ${count} venta${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} para actualizar el avance del objetivo.`
    case 'pending_payouts':
      return `Hay ${count} solicitud${count === 1 ? '' : 'es'} de pago esperando tu gestión.`
    case 'inactive_members':
      return `Hay ${count} miembro${count === 1 ? '' : 's'} que aún no ${count === 1 ? 'dio' : 'dieron'} el primer paso. Un mensaje a tiempo puede activar su avance.`
    case 'hot_contacts':
      return `Tienes ${count} contacto${count === 1 ? '' : 's'} activo${count === 1 ? '' : 's'} que conviene atender antes de que se enfríen.`
    case 'pending_tasks':
      return `Tienes ${count} acción${count === 1 ? '' : 'es'} del plan que merecen tu foco hoy.`
    default:
      return item.description
  }
}

function findAttentionByType(
  items: DashboardAttentionItem[],
  type: DashboardAttentionItemType,
): DashboardAttentionItem | undefined {
  return items.find((item) => item.type === type && item.isVisible && item.count > 0)
}

export function resolveNextBestAction(
  overview: DashboardOverviewData,
  scoped?: {
    commercialGoal: DashboardOverviewData['commercialGoal']
    sales: DashboardOverviewData['sales']
    attentionItems: DashboardOverviewData['attentionItems']
  },
): DashboardNextBestAction {
  const sales = scoped?.sales ?? overview.sales
  const attentionItems = scoped?.attentionItems ?? overview.attentionItems
  const visibleAttention = attentionItems.filter((item) => item.isVisible && item.count > 0)
  const highPriorityItem = visibleAttention.find((item) => item.priority === 'high')

  if (highPriorityItem) {
    return {
      title: highPriorityItem.title,
      message: buildAttentionNextActionMessage(highPriorityItem),
      ctaLabel: getAttentionActionLabel(highPriorityItem.type),
      href: highPriorityItem.href,
      priority: 'high',
    }
  }

  if (sales.pendingSalesCount > 0) {
    const count = sales.pendingSalesCount
    return {
      title: 'Ventas pendientes',
      message:
        count === 1
          ? 'Revisa la venta pendiente para actualizar el avance del objetivo.'
          : `Revisa las ${count} ventas pendientes para actualizar el avance del objetivo.`,
      ctaLabel: 'Revisar ventas pendientes',
      href: '/dashboard/progreso-equipo',
      priority: 'high',
    }
  }

  const inactiveMembers = findAttentionByType(visibleAttention, 'inactive_members')
  if (inactiveMembers) {
    return {
      title: 'Miembros sin activar',
      message: buildAttentionNextActionMessage(inactiveMembers),
      ctaLabel: 'Ver mi grupo',
      href: inactiveMembers.href,
      priority: 'medium',
    }
  }

  const hotContacts = findAttentionByType(visibleAttention, 'hot_contacts')
  if (hotContacts) {
    return {
      title: 'Contactos activos',
      message: 'Atiende los contactos activos antes de que se enfríen.',
      ctaLabel: 'Ver contactos',
      href: hotContacts.href,
      priority: 'medium',
    }
  }

  if (overview.rewards.rewardsPayableAmount > 0) {
    return {
      title: 'Recompensas disponibles',
      message: `Tienes ${formatDashboardCurrency(overview.rewards.rewardsPayableAmount)} listos para solicitar pago.`,
      ctaLabel: 'Ver recompensas',
      href: '/dashboard/recompensas',
      priority: 'low',
    }
  }

  return {
    title: 'Todo en orden',
    message: 'Todo está en orden. Mantén el ritmo y revisa el avance del equipo.',
    ctaLabel: 'Ver plan de acción',
    href: '/dashboard/plan',
    priority: 'calm',
  }
}
