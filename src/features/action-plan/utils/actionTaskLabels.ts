import type { ActionTaskPriority, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'

export const ACTION_TASK_STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Pendiente' },
  { value: 'in_progress' as const, label: 'En progreso' },
  { value: 'completed' as const, label: 'Completada' },
]

export const ACTION_TASK_PRIORITY_OPTIONS = [
  { value: 'low' as const, label: 'Baja' },
  { value: 'medium' as const, label: 'Media' },
  { value: 'high' as const, label: 'Alta' },
]

export function getActionTaskStatusLabel(status: ActionTaskStatus): string {
  return ACTION_TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

export function getActionTaskPriorityLabel(priority: ActionTaskPriority): string {
  return ACTION_TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority
}
