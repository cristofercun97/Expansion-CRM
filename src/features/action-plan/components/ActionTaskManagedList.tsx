import { useCallback } from 'react'
import type { ActionTask, ActionTaskProgress, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskGroupedList } from '@/features/action-plan/components/ActionTaskGroupedList'
import { ActionTaskStatusSelect } from '@/features/action-plan/components/ActionTaskStatusSelect'
import { ActionTaskVisualCard } from '@/features/action-plan/components/ActionTaskVisualCard'
import {
  calculateTaskCompliance,
  getMemberProgressStatus,
} from '@/features/action-plan/utils/actionTaskProgressUtils'
import { resolveTaskDocumentStatus } from '@/features/action-plan/utils/actionTaskGroupingUtils'

type ActionTaskManagedListProps = {
  tasks: ActionTask[]
  teamProgress: ActionTaskProgress[]
  ownerUid?: string | null
  ownerProgressByTaskId?: ReadonlyMap<string, ActionTaskProgress>
  updatingTaskId?: string | null
  onOwnerProgressChange?: (taskId: string, status: ActionTaskStatus) => void
}

function ComplianceSummary({ taskId, teamProgress }: { taskId: string; teamProgress: ActionTaskProgress[] }) {
  const compliance = calculateTaskCompliance(teamProgress, taskId)

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-full bg-green-500/15 px-2.5 py-1 font-medium text-green-200">
        Completados: {compliance.completed}
      </span>
      <span className="rounded-full bg-gold/15 px-2.5 py-1 font-medium text-gold-light">
        En progreso: {compliance.inProgress}
      </span>
      <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-hero-text/75">
        Pendientes: {compliance.pending}
      </span>
    </div>
  )
}

export function ActionTaskManagedList({
  tasks,
  teamProgress,
  ownerUid = null,
  ownerProgressByTaskId,
  updatingTaskId,
  onOwnerProgressChange,
}: ActionTaskManagedListProps) {
  const showOwnerProgress = Boolean(ownerUid && ownerProgressByTaskId && onOwnerProgressChange)

  const resolveStatus = useCallback(
    (task: ActionTask) => {
      if (showOwnerProgress && ownerProgressByTaskId) {
        return getMemberProgressStatus(ownerProgressByTaskId, task.id)
      }

      return resolveTaskDocumentStatus(task)
    },
    [ownerProgressByTaskId, showOwnerProgress],
  )

  return (
    <ActionTaskGroupedList
      tasks={tasks}
      resolveStatus={resolveStatus}
      renderTask={(task) => {
        const ownerStatus = showOwnerProgress
          ? getMemberProgressStatus(ownerProgressByTaskId!, task.id)
          : null
        const displayStatus = ownerStatus ?? task.status

        return (
          <ActionTaskVisualCard
            key={task.id}
            task={task}
            status={displayStatus}
            footer={<ComplianceSummary taskId={task.id} teamProgress={teamProgress} />}
            actions={
              showOwnerProgress ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-hero-text/60">Tu progreso</p>
                  <ActionTaskStatusSelect
                    taskId={task.id}
                    value={ownerStatus ?? 'pending'}
                    isUpdating={updatingTaskId === task.id}
                    onChange={onOwnerProgressChange!}
                  />
                </div>
              ) : null
            }
          />
        )
      }}
    />
  )
}
