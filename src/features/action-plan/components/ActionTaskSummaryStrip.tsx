import { CheckCircle2, ClipboardList, Clock3, ListTodo } from 'lucide-react'
import { useMemo } from 'react'
import type { ActionTask } from '@/features/action-plan/types/action-plan.types'
import {
  summarizeActionTasks,
  type TaskStatusResolver,
} from '@/features/action-plan/utils/actionTaskGroupingUtils'
import { cn } from '@/lib/utils'

type ActionTaskSummaryStripProps = {
  tasks: ActionTask[]
  resolveStatus: TaskStatusResolver
  className?: string
}

const SUMMARY_ITEMS = [
  {
    key: 'total',
    label: 'Total de acciones',
    icon: ListTodo,
    accent: 'border-white/15 bg-white/8 text-hero-text',
    iconAccent: 'bg-white/10 text-hero-text',
  },
  {
    key: 'pending',
    label: 'Pendientes',
    icon: ClipboardList,
    accent: 'border-white/15 bg-white/8 text-hero-text',
    iconAccent: 'bg-white/10 text-hero-text/80',
  },
  {
    key: 'inProgress',
    label: 'En progreso',
    icon: Clock3,
    accent: 'border-gold/20 bg-gold/10 text-gold-light',
    iconAccent: 'bg-gold/15 text-gold-light',
  },
  {
    key: 'completed',
    label: 'Completadas',
    icon: CheckCircle2,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
    iconAccent: 'bg-teal-accent/15 text-teal-accent',
  },
] as const

export function ActionTaskSummaryStrip({
  tasks,
  resolveStatus,
  className,
}: ActionTaskSummaryStripProps) {
  const summary = useMemo(
    () => summarizeActionTasks(tasks, resolveStatus),
    [resolveStatus, tasks],
  )

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon
        const value = summary[item.key]

        return (
          <div
            key={item.key}
            className={cn(
              'rounded-2xl border p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl',
              item.accent,
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  item.iconAccent,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-hero-text/60">{item.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
