import type { ActionTask, ActionTaskStatus } from '@/features/action-plan/types/action-plan.types'
import { SUGGESTED_TEAM_MAP_AREAS } from '@/features/action-plan/utils/teamActionMapUtils'

export const GENERAL_ACTIONS_AREA_LABEL = 'Acciones generales'

export type ActionTaskAreaGroup = {
  areaKey: string
  areaTitle: string
  tasks: ActionTask[]
  completedCount: number
  totalCount: number
}

export type ActionTaskSummaryCounts = {
  total: number
  pending: number
  inProgress: number
  completed: number
}

export type TaskStatusResolver = (task: ActionTask) => ActionTaskStatus

export function resolveTaskDocumentStatus(task: ActionTask): ActionTaskStatus {
  return task.status
}

export function summarizeActionTasks(
  tasks: ActionTask[],
  resolveStatus: TaskStatusResolver,
): ActionTaskSummaryCounts {
  return tasks.reduce<ActionTaskSummaryCounts>(
    (accumulator, task) => {
      const status = resolveStatus(task)
      accumulator.total += 1

      if (status === 'completed') {
        accumulator.completed += 1
      } else if (status === 'in_progress') {
        accumulator.inProgress += 1
      } else {
        accumulator.pending += 1
      }

      return accumulator
    },
    { total: 0, pending: 0, inProgress: 0, completed: 0 },
  )
}

function getAreaTitle(task: ActionTask): string {
  const title = task.areaTitle?.trim()

  if (title) {
    return title
  }

  return GENERAL_ACTIONS_AREA_LABEL
}

function compareAreaGroups(left: ActionTaskAreaGroup, right: ActionTaskAreaGroup): number {
  if (left.areaTitle === GENERAL_ACTIONS_AREA_LABEL) {
    return 1
  }

  if (right.areaTitle === GENERAL_ACTIONS_AREA_LABEL) {
    return -1
  }

  const leftSuggestedIndex = SUGGESTED_TEAM_MAP_AREAS.indexOf(
    left.areaTitle as (typeof SUGGESTED_TEAM_MAP_AREAS)[number],
  )
  const rightSuggestedIndex = SUGGESTED_TEAM_MAP_AREAS.indexOf(
    right.areaTitle as (typeof SUGGESTED_TEAM_MAP_AREAS)[number],
  )

  if (leftSuggestedIndex !== -1 && rightSuggestedIndex !== -1) {
    return leftSuggestedIndex - rightSuggestedIndex
  }

  if (leftSuggestedIndex !== -1) {
    return -1
  }

  if (rightSuggestedIndex !== -1) {
    return 1
  }

  return left.areaTitle.localeCompare(right.areaTitle, 'es')
}

export function groupTasksByArea(
  tasks: ActionTask[],
  resolveStatus: TaskStatusResolver,
): ActionTaskAreaGroup[] {
  const groups = new Map<string, ActionTaskAreaGroup>()

  for (const task of tasks) {
    const areaTitle = getAreaTitle(task)
    const areaKey = areaTitle.toLowerCase()
    const existingGroup = groups.get(areaKey)

    if (existingGroup) {
      existingGroup.tasks.push(task)
      existingGroup.totalCount += 1

      if (resolveStatus(task) === 'completed') {
        existingGroup.completedCount += 1
      }

      continue
    }

    groups.set(areaKey, {
      areaKey,
      areaTitle,
      tasks: [task],
      totalCount: 1,
      completedCount: resolveStatus(task) === 'completed' ? 1 : 0,
    })
  }

  return [...groups.values()].sort(compareAreaGroups)
}

export function getAreaCompliancePercent(group: ActionTaskAreaGroup): number {
  if (group.totalCount === 0) {
    return 0
  }

  return Math.round((group.completedCount / group.totalCount) * 100)
}
