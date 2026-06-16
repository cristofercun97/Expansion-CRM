import type { ActionTask, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskStatusSelect } from '@/features/action-plan/components/ActionTaskStatusSelect'
import {
  getActionTaskPriorityLabel,
  getActionTaskStatusLabel,
} from '@/features/action-plan/utils/actionTaskLabels'
import { isActionTaskOverdue } from '@/features/action-plan/utils/actionTaskKpis'
import { formatContactDate } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

type ActionTaskListProps = {
  tasks: ActionTask[]
  updatingTaskId?: string | null
  onStatusChange: (taskId: string, status: ActionTaskStatus) => void
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return 'Sin fecha límite'
  }

  const parsed = new Date(`${dueDate}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return '—'
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

export function ActionTaskList({ tasks, updatingTaskId, onStatusChange }: ActionTaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const overdue = isActionTaskOverdue(task)
        const description = task.description.trim()

        return (
          <article
            key={task.id}
            className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-hero-text">{task.title}</h3>
                  {overdue ? (
                    <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-200">
                      Vencida
                    </span>
                  ) : null}
                </div>

                {description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-hero-text/70">{description}</p>
                ) : (
                  <p className="mt-1 text-sm italic text-hero-text/45">Sin descripción</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-hero-text/65">
                  <PriorityBadge priority={task.priority} />
                  <span>{getActionTaskStatusLabel(task.status)}</span>
                  <span>Límite: {formatDueDate(task.dueDate)}</span>
                  <span>Creada: {formatContactDate(task.createdAt)}</span>
                </div>
              </div>

              <ActionTaskStatusSelect
                taskId={task.id}
                value={task.status}
                isUpdating={updatingTaskId === task.id}
                onChange={onStatusChange}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}
