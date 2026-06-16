import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-petrol-dark/15',
        'bg-white/60 px-6 py-10 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 inline-flex rounded-full bg-teal/10 p-3">
          <Icon className="h-6 w-6 text-teal" aria-hidden="true" />
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-text-dark">{title}</h3>

      {description ? (
        <p className="mt-2 max-w-sm text-sm text-text-soft">{description}</p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
