import type { ActionTask, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { ActionTaskGroupedList } from '@/features/action-plan/components/ActionTaskGroupedList'
import { ActionTaskStatusSelect } from '@/features/action-plan/components/ActionTaskStatusSelect'
import { ActionTaskVisualCard } from '@/features/action-plan/components/ActionTaskVisualCard'
import { resolveTaskDocumentStatus } from '@/features/action-plan/utils/actionTaskGroupingUtils'

type ActionTaskListProps = {
  tasks: ActionTask[]
  updatingTaskId?: string | null
  onStatusChange: (taskId: string, status: ActionTaskStatus) => void
}

export function ActionTaskList({ tasks, updatingTaskId, onStatusChange }: ActionTaskListProps) {
  return (
    <ActionTaskGroupedList
      tasks={tasks}
      resolveStatus={resolveTaskDocumentStatus}
      renderTask={(task) => (
        <ActionTaskVisualCard
          key={task.id}
          task={task}
          status={task.status}
          actions={
            <ActionTaskStatusSelect
              taskId={task.id}
              value={task.status}
              isUpdating={updatingTaskId === task.id}
              onChange={onStatusChange}
            />
          }
        />
      )}
    />
  )
}
