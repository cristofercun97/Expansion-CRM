import { useCallback } from 'react'
import type { ActionTask, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskGroupedList } from '@/features/action-plan/components/ActionTaskGroupedList'
import { ActionTaskStatusSelect } from '@/features/action-plan/components/ActionTaskStatusSelect'
import { ActionTaskVisualCard } from '@/features/action-plan/components/ActionTaskVisualCard'
import { getMemberProgressStatus } from '@/features/action-plan/utils/actionTaskProgressUtils'
import type { ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'

type ActionTaskMemberListProps = {
  tasks: ActionTask[]
  progressByTaskId: ReadonlyMap<string, ActionTaskProgress>
  updatingTaskId?: string | null
  onProgressChange: (taskId: string, status: ActionTaskStatus) => void
}

export function ActionTaskMemberList({
  tasks,
  progressByTaskId,
  updatingTaskId,
  onProgressChange,
}: ActionTaskMemberListProps) {
  const resolveStatus = useCallback(
    (task: ActionTask) => getMemberProgressStatus(progressByTaskId, task.id),
    [progressByTaskId],
  )

  return (
    <ActionTaskGroupedList
      tasks={tasks}
      resolveStatus={resolveStatus}
      renderTask={(task) => {
        const myStatus = getMemberProgressStatus(progressByTaskId, task.id)

        return (
          <ActionTaskVisualCard
            key={task.id}
            task={task}
            status={myStatus}
            actions={
              <div className="space-y-1">
                <p className="text-xs font-medium text-hero-text/60">Tu progreso</p>
                <ActionTaskStatusSelect
                  taskId={task.id}
                  value={myStatus}
                  isUpdating={updatingTaskId === task.id}
                  onChange={onProgressChange}
                />
              </div>
            }
          />
        )
      }}
    />
  )
}
