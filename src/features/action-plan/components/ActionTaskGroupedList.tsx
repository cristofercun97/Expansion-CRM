import type { ReactNode } from 'react'
import type { ActionTask } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskSummaryStrip } from '@/features/action-plan/components/ActionTaskSummaryStrip'
import {
  getAreaCompliancePercent,
  groupTasksByArea,
  type TaskStatusResolver,
} from '@/features/action-plan/utils/actionTaskGroupingUtils'
import { cn } from '@/lib/utils'

type ActionTaskGroupedListProps = {
  tasks: ActionTask[]
  resolveStatus: TaskStatusResolver
  renderTask: (task: ActionTask) => ReactNode
  className?: string
}

function AreaComplianceBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-hero-text/55">Cumplimiento del área</span>
        <span className="font-semibold text-hero-text">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-accent/80 to-gold/70 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function ActionTaskGroupedList({
  tasks,
  resolveStatus,
  renderTask,
  className,
}: ActionTaskGroupedListProps) {
  const groups = groupTasksByArea(tasks, resolveStatus)

  return (
    <div className={cn('space-y-5', className)}>
      <ActionTaskSummaryStrip tasks={tasks} resolveStatus={resolveStatus} />

      <div className="space-y-4">
        {groups.map((group) => {
          const compliancePercent = getAreaCompliancePercent(group)

          return (
            <section
              key={group.areaKey}
              className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl"
            >
              <div className="border-b border-white/10 bg-white/5 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-light/75">
                      Área del mapa
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-hero-text">{group.areaTitle}</h3>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-hero-text/75">
                    {group.totalCount}{' '}
                    {group.totalCount === 1 ? 'acción' : 'acciones'}
                  </div>
                </div>

                <p className="mt-2 text-sm text-hero-text/70">
                  {group.completedCount} de {group.totalCount}{' '}
                  {group.totalCount === 1 ? 'acción completada' : 'acciones completadas'}
                </p>

                <AreaComplianceBar percent={compliancePercent} />
              </div>

              <div className="space-y-3 p-4 sm:p-5">{group.tasks.map((task) => renderTask(task))}</div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
