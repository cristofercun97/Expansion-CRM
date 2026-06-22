import type { ActionTask, ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { TeamActionMapReview } from '@/features/action-plan/types/team-action-map-review.types'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type {
  MemberAcademySummary,
  MemberDashboardProgress,
  MemberDashboardRawData,
  MemberNextStep,
  MemberPlanSummary,
  ResolveMemberDashboardTeamIdInput,
} from '@/features/member-dashboard/types/member-dashboard.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'

export function resolveMemberDashboardTeamId(
  appUser: ResolveMemberDashboardTeamIdInput | null | undefined,
): string | null {
  const homeTeamId = appUser?.homeTeamId?.trim()

  if (homeTeamId) {
    return homeTeamId
  }

  const ownedTeamId = appUser?.ownedTeamId?.trim()

  if (ownedTeamId) {
    return ownedTeamId
  }

  return null
}

function buildAcademySummary(
  materials: AcademyMaterial[],
  engagements: AcademyMaterialEngagement[],
  attempts: AcademyTestAttempt[],
): MemberAcademySummary {
  const activeMaterials = [...materials]
    .filter((material) => material.isActive)
    .sort((left, right) => left.title.localeCompare(right.title, 'es'))

  const reviewedMaterialIds = new Set(engagements.map((engagement) => engagement.materialId))
  const reviewedMaterialsCount = activeMaterials.filter((material) =>
    reviewedMaterialIds.has(material.id),
  ).length
  const nextPendingModule = activeMaterials.find((material) => !reviewedMaterialIds.has(material.id))
  const testsCompleted = attempts.length
  const averageScore =
    testsCompleted > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / testsCompleted)
      : null

  return {
    reviewedMaterialsCount,
    totalMaterials: activeMaterials.length,
    testsCompleted,
    averageScore,
    nextPendingModuleTitle: nextPendingModule?.title ?? null,
  }
}

function buildPlanSummary(
  tasks: ActionTask[],
  taskProgress: ActionTaskProgress[],
): MemberPlanSummary {
  const sortedTasks = [...tasks].sort((left, right) =>
    left.title.localeCompare(right.title, 'es'),
  )
  const progressByTaskId = new Map(taskProgress.map((progress) => [progress.taskId, progress]))

  let completedTasksCount = 0
  let inProgressTasksCount = 0
  let pendingTasksCount = 0
  let nextPendingTaskTitle: string | null = null
  let nextPendingTaskAreaTitle: string | null = null

  for (const task of sortedTasks) {
    const progress = progressByTaskId.get(task.id)
    const status = progress?.status ?? 'pending'

    if (status === 'completed') {
      completedTasksCount += 1
      continue
    }

    if (status === 'in_progress') {
      inProgressTasksCount += 1
    } else {
      pendingTasksCount += 1
    }

    if (!nextPendingTaskTitle) {
      nextPendingTaskTitle = task.title
      nextPendingTaskAreaTitle = task.areaTitle?.trim() || null
    }
  }

  return {
    completedTasksCount,
    totalTasks: sortedTasks.length,
    inProgressTasksCount,
    pendingTasksCount,
    nextPendingTaskTitle,
    nextPendingTaskAreaTitle,
  }
}

function buildNextStep(
  academy: MemberAcademySummary,
  plan: MemberPlanSummary,
  unreadRemindersCount: number,
  latestWeeklyReview: TeamActionMapReview | null,
): MemberNextStep {
  if (unreadRemindersCount > 0) {
    return {
      kind: 'reminders',
      message: 'Lee tus recordatorios del grupo para saber en qué enfocarte.',
      ctaLabel: 'Ver recordatorios',
      ctaTo: '#member-reminders',
    }
  }

  if (latestWeeklyReview?.weeklyStatus === 'red') {
    return {
      kind: 'weekly_review',
      message:
        'Tu grupo necesita acción esta semana. Revisa el Plan de Acción y completa tus pendientes.',
      ctaLabel: 'Ver Plan de Acción',
      ctaTo: '/dashboard/plan',
    }
  }

  if (latestWeeklyReview?.weeklyStatus === 'yellow') {
    return {
      kind: 'weekly_review',
      message: 'Tu grupo necesita atención. Revisa tus tareas y avanza en el siguiente paso.',
      ctaLabel: 'Ver Plan de Acción',
      ctaTo: '/dashboard/plan',
    }
  }

  if (academy.nextPendingModuleTitle) {
    return {
      kind: 'academy',
      message: `Continúa con el siguiente módulo: ${academy.nextPendingModuleTitle}`,
      ctaLabel: 'Ir a Academia',
      ctaTo: '/dashboard/academia',
    }
  }

  if (plan.nextPendingTaskTitle) {
    return {
      kind: 'plan',
      message: `Completa tu próxima tarea: ${plan.nextPendingTaskTitle}`,
      ctaLabel: 'Ver Plan de Acción',
      ctaTo: '/dashboard/plan',
    }
  }

  if (latestWeeklyReview?.weeklyStatus === 'green') {
    return {
      kind: 'weekly_review',
      message: 'Tu grupo va bien. Mantén el ritmo y completa tu próximo avance.',
      ctaLabel: 'Ver Plan de Acción',
      ctaTo: '/dashboard/plan',
    }
  }

  return {
    kind: 'complete',
    message: 'Excelente avance. Mantén el ritmo y espera nuevas indicaciones de tu líder.',
    ctaLabel: 'Ver mi grupo',
    ctaTo: '/dashboard/mi-grupo',
  }
}

export function buildMemberDashboardProgress(data: MemberDashboardRawData): MemberDashboardProgress {
  const academy = buildAcademySummary(data.materials, data.engagements, data.attempts)
  const plan = buildPlanSummary(data.tasks, data.taskProgress)
  const unreadRemindersCount = data.reminders.filter(
    (reminder) => reminder.status === 'unread',
  ).length
  const lastReminder = data.reminders[0] ?? null

  return {
    teamId: data.teamId,
    academy,
    plan,
    reminders: data.reminders,
    unreadRemindersCount,
    lastReminderTitle: lastReminder?.title ?? null,
    latestWeeklyReview: data.latestWeeklyReview,
    nextStep: buildNextStep(academy, plan, unreadRemindersCount, data.latestWeeklyReview),
  }
}

export function applyReminderReadToProgress(
  progress: MemberDashboardProgress,
  reminderId: string,
): MemberDashboardProgress {
  const reminders = progress.reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, status: 'read' as const } : reminder,
  )
  const unreadRemindersCount = reminders.filter((reminder) => reminder.status === 'unread').length

  return {
    ...progress,
    reminders,
    unreadRemindersCount,
    lastReminderTitle: reminders[0]?.title ?? null,
    nextStep: buildNextStep(
      progress.academy,
      progress.plan,
      unreadRemindersCount,
      progress.latestWeeklyReview,
    ),
  }
}

export function sortRemindersByCreatedAtDesc(reminders: TeamReminder[]): TeamReminder[] {
  return [...reminders].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}
