import type { Timestamp } from 'firebase/firestore'

export const ACTION_TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const
export const ACTION_TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export type ActionTaskStatus = (typeof ACTION_TASK_STATUSES)[number]
export type ActionTaskPriority = (typeof ACTION_TASK_PRIORITIES)[number]
export type ActionTaskResponsibleType = 'all' | 'leader' | 'member'

export type ActionTask = {
  id: string
  ownerUid: string
  teamId?: string | null
  title: string
  description: string
  status: ActionTaskStatus
  priority: ActionTaskPriority
  dueDate: string | null
  roadmapId?: string | null
  roadmapTeamId?: string | null
  areaId?: string | null
  areaTitle?: string | null
  responsibleType?: ActionTaskResponsibleType | null
  responsibleUid?: string | null
  responsibleName?: string | null
  startDate?: string | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type ActionTaskProgress = {
  id: string
  taskId: string
  teamId: string
  memberUid: string
  memberName: string
  memberEmail: string
  status: ActionTaskStatus
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type ActionTaskCompliance = {
  completed: number
  inProgress: number
  pending: number
}

export type UpsertActionTaskProgressInput = {
  taskId: string
  teamId: string
  memberUid: string
  memberName: string
  memberEmail: string
  status: ActionTaskStatus
}

export type CreateActionTaskInput = {
  title: string
  description: string
  status: ActionTaskStatus
  priority: ActionTaskPriority
  dueDate?: string
  startDate?: string
  roadmapId?: string
  roadmapTeamId?: string
  areaId?: string
  areaTitle?: string
  responsibleType?: ActionTaskResponsibleType
  responsibleUid?: string | null
  responsibleName?: string | null
}

export type ActionTaskKpis = {
  pending: number
  inProgress: number
  completed: number
  overdue: number
}
