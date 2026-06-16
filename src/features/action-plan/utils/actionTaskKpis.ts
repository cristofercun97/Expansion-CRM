import type { ActionTask, ActionTaskKpis } from '@/features/action-plan/types/action-plan.types'

export function isActionTaskOverdue(task: ActionTask): boolean {
  if (task.status === 'completed' || !task.dueDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  return dueDate < today
}

export function calculateActionTaskKpis(tasks: ActionTask[]): ActionTaskKpis {
  return tasks.reduce<ActionTaskKpis>(
    (accumulator, task) => {
      if (task.status === 'pending') {
        accumulator.pending += 1
      }

      if (task.status === 'in_progress') {
        accumulator.inProgress += 1
      }

      if (task.status === 'completed') {
        accumulator.completed += 1
      }

      if (isActionTaskOverdue(task)) {
        accumulator.overdue += 1
      }

      return accumulator
    },
    { pending: 0, inProgress: 0, completed: 0, overdue: 0 },
  )
}
