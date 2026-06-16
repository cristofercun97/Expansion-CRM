import type { Timestamp } from 'firebase/firestore'

export const ACTION_TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const
export const ACTION_TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export type ActionTaskStatus = (typeof ACTION_TASK_STATUSES)[number]
export type ActionTaskPriority = (typeof ACTION_TASK_PRIORITIES)[number]

export type ActionTask = {
  id: string
  ownerUid: string
  title: string
  description: string
  status: ActionTaskStatus
  priority: ActionTaskPriority
  dueDate: string | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateActionTaskInput = {
  title: string
  description: string
  status: ActionTaskStatus
  priority: ActionTaskPriority
  dueDate?: string
}

export type ActionTaskKpis = {
  pending: number
  inProgress: number
  completed: number
  overdue: number
}
