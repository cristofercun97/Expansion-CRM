import {
  ArrowRight,
  Bell,
  ClipboardList,
  Receipt,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { AttentionRadarIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type {
  DashboardAttentionItem,
  DashboardAttentionItemType,
  DashboardAttentionPriority,
} from '@/features/dashboard/types/dashboard-overview.types'
import {
  getAttentionActionLabel,
  getAttentionHumanDescription,
} from '@/features/dashboard/utils/dashboardOverviewMicrocopy'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type DashboardAttentionCardProps = {
  attentionItems: DashboardAttentionItem[]
  loading?: boolean
}

const PRIORITY_ORDER: Record<DashboardAttentionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const PRIORITY_CLASS: Record<DashboardAttentionPriority, string> = {
  high: 'border-gold/25 bg-gradient-to-br from-gold/12 to-white/4',
  medium: 'border-teal-accent/20 bg-gradient-to-br from-teal-accent/10 to-white/4',
  low: 'border-white/10 bg-white/5',
}

const ATTENTION_ICONS: Record<DashboardAttentionItemType, LucideIcon> = {
  unread_reminders: Bell,
  pending_tasks: ClipboardList,
  hot_contacts: Users,
  pending_sales: Receipt,
  pending_payouts: Wallet,
  inactive_members: UserCheck,
}

export function DashboardAttentionCard({ attentionItems, loading = false }: DashboardAttentionCardProps) {
  const visibleItems = [...attentionItems]
    .filter((item) => item.isVisible && item.count > 0)
    .sort((left, right) => PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority])

  return (
    <DashboardOverviewCard
      title="Atención requerida"
      subtitle="Señales importantes para actuar hoy."
      loading={loading}
      illustration={<AttentionRadarIllustration size="header" />}
      id="dashboard-attention"
    >
      {!loading && visibleItems.length === 0 ? (
        <DashboardEmptyState
          compact
          title="Todo en orden"
          description="No hay señales urgentes ahora. Sigue avanzando con calma."
          illustration={<AttentionRadarIllustration size="empty" className="mx-auto opacity-70" />}
        />
      ) : null}

      {!loading && visibleItems.length > 0 ? (
        <ul className="space-y-2.5">
          {visibleItems.map((item) => {
            const Icon = ATTENTION_ICONS[item.type] ?? Bell

            return (
              <li
                key={item.id}
                className={cn(
                  'rounded-xl border px-3 py-3 transition-colors sm:px-4',
                  PRIORITY_CLASS[item.priority],
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-teal-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-hero-text">{item.title}</p>
                      <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold text-gold-light">
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-hero-text/75">
                      {getAttentionHumanDescription(item.type, item.description)}
                    </p>
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-accent hover:text-teal-accent/90"
                      >
                        {getAttentionActionLabel(item.type)}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </DashboardOverviewCard>
  )
}
