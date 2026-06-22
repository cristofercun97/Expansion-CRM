import {
  Bell,
  CheckCircle2,
  Contact,
  Gift,
  GraduationCap,
  ListTodo,
  Receipt,
  UserPlus,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { ActivityPulseIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type {
  DashboardRecentActivityItem,
  DashboardRecentActivityType,
} from '@/features/dashboard/types/dashboard-overview.types'
import { formatDashboardRelativeDate } from '@/features/dashboard/utils/dashboardOverviewFormatters'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type DashboardRecentActivityCardProps = {
  recentActivity: DashboardRecentActivityItem[]
  loading?: boolean
}

const VISIBLE_EVENTS = 5

const ACTIVITY_ICONS: Record<DashboardRecentActivityType, LucideIcon> = {
  sale_reported: Receipt,
  sale_validated: CheckCircle2,
  reward_generated: Gift,
  payout_requested: Wallet,
  member_joined: UserPlus,
  contact_created: Contact,
  academy_completed: GraduationCap,
  task_completed: ListTodo,
  reminder_received: Bell,
}

const ACTIVITY_ACCENT: Partial<Record<DashboardRecentActivityType, string>> = {
  sale_validated: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  payout_requested: 'border-gold/25 bg-gold/10 text-gold-light',
  reward_generated: 'border-gold/20 bg-gold/8 text-gold-light',
  sale_reported: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
}

function resolveActivityIcon(event: DashboardRecentActivityItem): LucideIcon {
  if (event.title === 'Pago rechazado') {
    return XCircle
  }

  if (event.title === 'Pago completado') {
    return CheckCircle2
  }

  return ACTIVITY_ICONS[event.type] ?? Bell
}

function resolveActivityAccent(event: DashboardRecentActivityItem): string | undefined {
  if (event.title === 'Pago rechazado') {
    return 'border-amber-400/25 bg-amber-400/10 text-amber-100'
  }

  if (event.title === 'Pago completado') {
    return 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent'
  }

  return ACTIVITY_ACCENT[event.type]
}

export function DashboardRecentActivityCard({
  recentActivity,
  loading = false,
}: DashboardRecentActivityCardProps) {
  const hasMore = recentActivity.length > VISIBLE_EVENTS
  const events = recentActivity.slice(0, VISIBLE_EVENTS)

  return (
    <DashboardOverviewCard
      title="Actividad reciente"
      subtitle="Lo más reciente en ventas, recompensas y avances del equipo."
      loading={loading}
      illustration={<ActivityPulseIllustration size="header" />}
      compact={!loading && events.length === 0}
    >
      {!loading && events.length === 0 ? (
        <DashboardEmptyState
          minimal
          title="Aún no hay movimiento reciente"
          description="Las ventas, recompensas y avances aparecerán aquí."
        />
      ) : null}

      {!loading && events.length > 0 ? (
        <div>
          <ul className="space-y-1">
            {events.map((event, index) => {
              const Icon = resolveActivityIcon(event)
              const accentClass = resolveActivityAccent(event)

              const content = (
                <div className="flex gap-3 py-2 sm:py-2">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                        accentClass ?? 'border-teal-accent/20 bg-teal-accent/10 text-teal-accent',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    {index < events.length - 1 ? (
                      <span
                        className="mt-1 w-0.5 flex-1 rounded-full bg-gradient-to-b from-teal-accent/35 to-transparent"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-hero-text">{event.title}</p>
                      <time className="shrink-0 text-xs text-hero-text/55">
                        {formatDashboardRelativeDate(event.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 break-words text-sm leading-relaxed text-hero-text/75">
                      {event.description}
                    </p>
                  </div>
                </div>
              )

              return (
                <li key={event.id}>
                  {event.href ? (
                    <Link
                      to={event.href}
                      className="block rounded-xl px-1 transition-colors hover:bg-white/5"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="px-1">{content}</div>
                  )}
                </li>
              )
            })}
          </ul>

          {hasMore ? (
            <Link to="/dashboard/recompensas" className="mt-3 block">
              <Button
                size="sm"
                variant="secondary"
                className="w-full border-white/15 bg-white/6 text-hero-text sm:w-auto"
              >
                Ver más actividad
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </DashboardOverviewCard>
  )
}
