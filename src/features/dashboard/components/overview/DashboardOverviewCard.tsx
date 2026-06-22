import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardOverviewCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  loading?: boolean
  headerAction?: ReactNode
  illustration?: ReactNode
  id?: string
  compact?: boolean
}

export function DashboardOverviewCard({
  title,
  subtitle,
  children,
  className,
  loading = false,
  headerAction,
  illustration,
  id,
  compact = false,
}: DashboardOverviewCardProps) {
  return (
    <section
      id={id}
      className={cn(
        'h-full rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl',
        compact ? 'p-4 sm:p-5' : 'p-4 sm:p-5 md:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-hero-text sm:text-lg">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-hero-text/65 sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {illustration ? (
            <div className="opacity-90" aria-hidden="true">
              {illustration}
            </div>
          ) : null}
          {headerAction}
        </div>
      </div>

      <div className={cn(compact ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5', loading && 'animate-pulse space-y-3')}>
        {loading ? (
          <>
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-8 w-1/2 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-5/6 rounded bg-white/10" />
          </>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
