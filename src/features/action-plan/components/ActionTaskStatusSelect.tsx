import { Loader2 } from 'lucide-react'
import type { ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ACTION_TASK_STATUS_OPTIONS } from '@/features/action-plan/utils/actionTaskLabels'
import { cn } from '@/lib/utils'

type ActionTaskStatusSelectProps = {
  taskId: string
  value: ActionTaskStatus
  disabled?: boolean
  isUpdating?: boolean
  onChange: (taskId: string, status: ActionTaskStatus) => void
  className?: string
}

export function ActionTaskStatusSelect({
  taskId,
  value,
  disabled = false,
  isUpdating = false,
  onChange,
  className,
}: ActionTaskStatusSelectProps) {
  return (
    <div className={cn('relative min-w-[9.5rem]', className)}>
      <select
        value={value}
        disabled={disabled || isUpdating}
        onChange={(event) => onChange(taskId, event.target.value as ActionTaskStatus)}
        aria-label="Cambiar estado de la tarea"
        className={cn(
          'h-9 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 pr-8 text-sm text-hero-text',
          'transition-colors focus:border-teal-accent focus:outline-none focus:ring-2 focus:ring-teal-accent/20',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {ACTION_TASK_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isUpdating ? (
        <Loader2
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-accent"
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}
