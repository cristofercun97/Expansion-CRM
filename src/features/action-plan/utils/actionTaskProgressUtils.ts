import type {
  ActionTaskCompliance,
  ActionTaskProgress,
  ActionTaskStatus,
} from '@/features/action-plan/types/action-plan.types'

export function getMemberProgressStatus(
  progressByTaskId: ReadonlyMap<string, ActionTaskProgress>,
  taskId: string,
): ActionTaskStatus {
  return progressByTaskId.get(taskId)?.status ?? 'pending'
}

export function calculateTaskCompliance(
  progressEntries: ActionTaskProgress[],
  taskId: string,
): ActionTaskCompliance {
  const forTask = progressEntries.filter((entry) => entry.taskId === taskId)

  return forTask.reduce<ActionTaskCompliance>(
    (accumulator, entry) => {
      if (entry.status === 'completed') {
        accumulator.completed += 1
      } else if (entry.status === 'in_progress') {
        accumulator.inProgress += 1
      } else {
        accumulator.pending += 1
      }

      return accumulator
    },
    { completed: 0, inProgress: 0, pending: 0 },
  )
}

export function buildProgressMapByTaskId(
  progressEntries: ActionTaskProgress[],
  memberUid: string,
): Map<string, ActionTaskProgress> {
  const map = new Map<string, ActionTaskProgress>()

  for (const entry of progressEntries) {
    if (entry.memberUid === memberUid) {
      map.set(entry.taskId, entry)
    }
  }

  return map
}
