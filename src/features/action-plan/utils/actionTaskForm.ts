import type {
  ActionTaskPriority,
  ActionTaskResponsibleType,
  ActionTaskStatus,
} from '@/features/action-plan/types/action-plan.types'

export type ActionTaskFormValues = {
  title: string
  description: string
  status: ActionTaskStatus | ''
  priority: ActionTaskPriority | ''
  dueDate: string
  startDate: string
  areaId: string
  responsibleType: ActionTaskResponsibleType
  responsibleMemberUid: string
}

export type ActionTaskFormErrors = {
  title?: string
  description?: string
  status?: string
  priority?: string
  responsibleMemberUid?: string
}

export const DEFAULT_ACTION_TASK_FORM: ActionTaskFormValues = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  startDate: '',
  areaId: '',
  responsibleType: 'all',
  responsibleMemberUid: '',
}

export function validateActionTaskForm(values: ActionTaskFormValues): ActionTaskFormErrors {
  const errors: ActionTaskFormErrors = {}
  const title = values.title.trim()

  if (title.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.'
  }

  if (values.description.trim().length > 300) {
    errors.description = 'La descripción no puede superar 300 caracteres.'
  }

  if (!values.status) {
    errors.status = 'Selecciona un estado inicial.'
  }

  if (!values.priority) {
    errors.priority = 'Selecciona una prioridad.'
  }

  if (values.responsibleType === 'member' && !values.responsibleMemberUid.trim()) {
    errors.responsibleMemberUid = 'Selecciona un miembro responsable.'
  }

  return errors
}

export function hasActionTaskFormErrors(errors: ActionTaskFormErrors): boolean {
  return Object.keys(errors).length > 0
}
