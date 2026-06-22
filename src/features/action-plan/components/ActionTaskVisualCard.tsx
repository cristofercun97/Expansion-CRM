import type { ReactNode } from 'react'
import type { ActionTask, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskMetaBadges } from '@/features/action-plan/components/ActionTaskMetaBadges'
import {
  getActionTaskPriorityLabel,
  getActionTaskStatusLabel,
} from '@/features/action-plan/utils/actionTaskLabels'
import { isActionTaskOverdue } from '@/features/action-plan/utils/actionTaskKpis'
import { cn } from '@/lib/utils'

type ActionTaskVisualCardProps = {
  task: ActionTask
  status: ActionTaskStatus
  actions?: ReactNode
  footer?: ReactNode
}

function formatTaskDate(value: string | null | undefined, fallback: string): string {
  if (!value?.trim()) {
    return fallback
  }

  const parsed = new Date(`${value.trim()}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function PriorityBadge({ priority }: { priority: ActionTask['priority'] }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        priority === 'high' && 'bg-red-500/15 text-red-200',
        priority === 'medium' && 'bg-gold/15 text-gold-light',
        priority === 'low' && 'bg-white/10 text-hero-text/70',
      )}
    >
      {getActionTaskPriorityLabel(priority)}
    </span>
  )
}

function StatusChip({ status }: { status: ActionTaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        status === 'completed' && 'border-teal-accent/30 bg-teal-accent/15 text-teal-accent',
        status === 'in_progress' && 'border-gold/30 bg-gold/15 text-gold-light',
        status === 'pending' && 'border-white/15 bg-white/10 text-hero-text/75',
      )}
    >
      {getActionTaskStatusLabel(status)}
    </span>
  )
}

export function ActionTaskVisualCard({
  task,
  status,
  actions,
  footer,
}: ActionTaskVisualCardProps) {
  const description = task.description.trim()
  const overdue = isActionTaskOverdue(task) && status !== 'completed'

  return (
    <article className="rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-hero-text">{task.title}</h3>
            <StatusChip status={status} />
            {overdue ? (
              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-200">
                Vencida
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-hero-text/70">
              {description}
            </p>
          ) : null}

          <ActionTaskMetaBadges task={task} />

          <div className="mt-3 flex flex-wrap gap-2">
            <PriorityBadge priority={task.priority} />
          </div>

          <div className="mt-3 grid gap-2 text-xs text-hero-text/60 sm:grid-cols-2">
            <p>
              <span className="text-hero-text/45">Inicio: </span>
              {formatTaskDate(task.startDate, 'Sin fecha de inicio')}
            </p>
            <p>
              <span className="text-hero-text/45">Límite: </span>
              {formatTaskDate(task.dueDate, 'Sin fecha límite')}
            </p>
          </div>

          {footer ? <div className="mt-3">{footer}</div> : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </article>
  )
}
