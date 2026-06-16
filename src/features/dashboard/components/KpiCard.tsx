import { cn } from '@/lib/utils'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'

type KpiCardProps = {
  kpi: DashboardKpi
  showProgress?: boolean
  progressValue?: number
  isLoading?: boolean
}

export function KpiCard({
  kpi,
  showProgress = false,
  progressValue = 0,
  isLoading = false,
}: KpiCardProps) {
  const Icon = kpi.icon

  return (
    <div className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        {showProgress ? (
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center"
            role="img"
            aria-label={`Avance: ${progressValue}%`}
          >
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progressValue * 0.94} 100`}
                className="text-teal-accent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-hero-text">{progressValue}%</span>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-hero-text/65">{kpi.label}</p>
      {isLoading ? (
        <>
          <div
            className="mt-1 h-9 w-16 animate-pulse rounded-lg bg-white/10"
            aria-hidden="true"
          />
          <div
            className="mt-2 h-3 w-28 animate-pulse rounded bg-white/10"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-hero-text">{kpi.value}</p>
          <p
            className={cn(
              'mt-1 text-xs',
              kpi.trend === 'up' ? 'text-teal-accent' : 'text-hero-text/55',
            )}
          >
            {kpi.detail}
          </p>
        </>
      )}
    </div>
  )
}
