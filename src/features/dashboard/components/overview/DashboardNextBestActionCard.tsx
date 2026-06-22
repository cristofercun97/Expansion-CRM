import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import type { DashboardOverviewData } from '@/features/dashboard/types/dashboard-overview.types'
import type { DashboardNextBestAction } from '@/features/dashboard/utils/dashboardNextBestAction.utils'
import { resolveNextBestAction } from '@/features/dashboard/utils/dashboardNextBestAction.utils'
import { cn } from '@/lib/utils'

type DashboardNextBestActionCardProps = {
  overview: DashboardOverviewData
  action?: DashboardNextBestAction
  loading?: boolean
}

const PRIORITY_CLASS = {
  high: 'border-gold/30 bg-gradient-to-r from-gold/12 via-white/6 to-teal-accent/8',
  medium: 'border-teal-accent/25 bg-gradient-to-r from-teal-accent/10 to-white/5',
  low: 'border-white/15 bg-white/6',
  calm: 'border-white/12 bg-gradient-to-r from-white/6 to-teal-accent/5',
} as const

export function DashboardNextBestActionCard({
  overview,
  action: providedAction,
  loading = false,
}: DashboardNextBestActionCardProps) {
  if (loading) {
    return (
      <div
        className="animate-pulse rounded-xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5"
        aria-hidden="true"
      >
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-3 h-3 w-full rounded bg-white/10" />
        <div className="mt-2 h-8 w-28 rounded bg-white/10" />
      </div>
    )
  }

  const action = providedAction ?? resolveNextBestAction(overview)

  return (
    <section
      className={cn(
        'rounded-xl border px-4 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] backdrop-blur-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4',
        PRIORITY_CLASS[action.priority],
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/12 text-gold-light">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-accent">
            Siguiente mejor acción
          </p>
          <p className="mt-0.5 text-sm font-medium text-hero-text">{action.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/75">{action.message}</p>
        </div>
      </div>

      <Link to={action.href} className="mt-3 block shrink-0 sm:mt-0">
        <Button
          size="sm"
          className={cn(
            'w-full sm:w-auto',
            action.priority === 'calm'
              ? 'border border-white/15 bg-white/8 text-hero-text hover:bg-white/12'
              : 'bg-gold text-petrol-deep hover:bg-gold-light',
          )}
          variant={action.priority === 'calm' ? 'secondary' : 'primary'}
        >
          {action.ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Link>
    </section>
  )
}
