import type { ReactNode } from 'react'
import { EmptyStateSparkIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import { cn } from '@/lib/utils'

type DashboardEmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  illustration?: ReactNode
  className?: string
  compact?: boolean
  minimal?: boolean
}

export function DashboardEmptyState({
  title,
  description,
  action,
  illustration,
  className,
  compact = false,
  minimal = false,
}: DashboardEmptyStateProps) {
  const showIllustration = !minimal && (illustration ?? true)

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-gradient-to-br from-white/6 via-transparent to-teal-accent/5 text-center',
        minimal ? 'px-3 py-3 sm:px-4' : compact ? 'px-4 py-3.5 sm:px-5' : 'px-4 py-6 sm:px-6',
        className,
      )}
    >
      {showIllustration ? illustration ?? <EmptyStateSparkIllustration size="empty" /> : null}
      <p
        className={cn(
          'font-medium text-hero-text',
          minimal ? 'text-sm' : compact ? 'mt-2.5 text-sm' : 'mt-4 text-sm',
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          'leading-relaxed text-hero-text/65',
          minimal ? 'mt-1 text-xs' : compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm',
        )}
      >
        {description}
      </p>
      {action ? <div className={cn(minimal ? 'mt-2.5' : compact ? 'mt-3' : 'mt-4')}>{action}</div> : null}
    </div>
  )
}
