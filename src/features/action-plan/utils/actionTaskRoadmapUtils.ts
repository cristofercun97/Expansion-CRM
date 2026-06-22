import type { ActionTask, ActionTaskResponsibleType } from '@/features/action-plan/types/action-plan.types'

export function getActionTaskAreaLabel(task: ActionTask): string | null {
  const areaTitle = task.areaTitle?.trim()

  if (areaTitle) {
    return areaTitle
  }

  return null
}

export function getActionTaskResponsibleLabel(task: ActionTask): string | null {
  if (!task.responsibleType) {
    return null
  }

  if (task.responsibleType === 'all') {
    return 'Todos los miembros'
  }

  if (task.responsibleType === 'leader') {
    return 'Líder'
  }

  if (task.responsibleType === 'member') {
    return task.responsibleName?.trim() || 'Miembro específico'
  }

  return null
}

export function buildActionTaskResponsiblePayload(input: {
  responsibleType: ActionTaskResponsibleType
  responsibleMemberUid: string
  responsibleMemberName: string
}): Pick<ActionTask, 'responsibleType' | 'responsibleUid' | 'responsibleName'> {
  if (input.responsibleType === 'member' && input.responsibleMemberUid.trim()) {
    return {
      responsibleType: 'member',
      responsibleUid: input.responsibleMemberUid.trim(),
      responsibleName: input.responsibleMemberName.trim() || null,
    }
  }

  if (input.responsibleType === 'leader') {
    return {
      responsibleType: 'leader',
      responsibleUid: null,
      responsibleName: null,
    }
  }

  return {
    responsibleType: 'all',
    responsibleUid: null,
    responsibleName: null,
  }
}

export function countTasksLinkedToArea(tasks: ActionTask[], areaId: string): number {
  return tasks.filter((task) => task.areaId === areaId).length
}
