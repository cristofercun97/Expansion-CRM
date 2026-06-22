import type { Timestamp } from 'firebase/firestore'
import type { ActionTask, ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import type {
  TeamMemberModuleProgressItem,
  TeamMemberOverallStatus,
  TeamMemberPriority,
  TeamMemberTaskProgressItem,
  TeamProgressSummary,
} from '@/features/team-progress/types/team-progress.types'
import type { TeamMember } from '@/features/team/types/team.types'
import type { AppUser } from '@/types'

export function buildTeamFollowUpMailto(email: string): string | null {
  const trimmed = email.trim()

  if (!trimmed || trimmed === '—') {
    return null
  }

  const subject = encodeURIComponent('Seguimiento de progreso - EXPANSIÓN')
  return `mailto:${trimmed}?subject=${subject}`
}

export function resolveMemberContactPhone(user: AppUser | null | undefined): string | null {
  const profilePhone = user?.profile?.phone?.trim()
  const rootPhone = user?.phone?.trim()
  const phone = profilePhone || rootPhone

  return phone || null
}

export function resolveMemberPhotoURL(user: AppUser | null | undefined): string | null {
  const profilePhoto = user?.profile?.photoURL?.trim()
  const rootPhoto = user?.photoURL?.trim()
  const photoURL = profilePhoto || rootPhoto

  return photoURL || null
}

export function buildTeamMemberWhatsAppUrl(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim()

  if (!trimmed) {
    return null
  }

  const digits = trimmed.replace(/\D/g, '')

  if (digits.length < 8) {
    return null
  }

  return `https://wa.me/${digits}`
}

export function buildMemberContactInfoFromUser(user: AppUser | null | undefined): {
  phone: string | null
  photoURL: string | null
} {
  return {
    phone: resolveMemberContactPhone(user),
    photoURL: resolveMemberPhotoURL(user),
  }
}

export function getTeamMemberOverallStatusLabel(status: TeamMemberOverallStatus): string {
  switch (status) {
    case 'not_started':
      return 'Sin iniciar'
    case 'in_follow_up':
      return 'En seguimiento'
    case 'good_progress':
      return 'Buen avance'
    case 'excellent':
      return 'Excelente'
  }
}

export function getTeamMemberOverallStatusBadgeClassName(status: TeamMemberOverallStatus): string {
  switch (status) {
    case 'not_started':
      return 'border-amber-400/30 bg-amber-500/15 text-amber-100'
    case 'in_follow_up':
      return 'border-sky-400/30 bg-sky-500/15 text-sky-100'
    case 'good_progress':
      return 'border-teal-accent/35 bg-teal-accent/15 text-teal-accent'
    case 'excellent':
      return 'border-gold/35 bg-gold/15 text-gold-light'
  }
}

export function getTeamMemberPriorityLabel(priority: TeamMemberPriority): string {
  switch (priority) {
    case 'high':
      return 'Alta'
    case 'medium':
      return 'Media'
    case 'low':
      return 'Baja'
  }
}

export function getTeamMemberPriorityBadgeClassName(priority: TeamMemberPriority): string {
  switch (priority) {
    case 'high':
      return 'border-red-400/30 bg-red-500/15 text-red-200'
    case 'medium':
      return 'border-amber-400/30 bg-amber-500/15 text-amber-100'
    case 'low':
      return 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent'
  }
}

export function getTeamMemberRecommendation(status: TeamMemberOverallStatus): string {
  switch (status) {
    case 'not_started':
      return 'Contactar y acompañar en el primer paso.'
    case 'in_follow_up':
      return 'Revisar bloqueos y reforzar objetivos.'
    case 'good_progress':
      return 'Mantener seguimiento y reconocer progreso.'
    case 'excellent':
      return 'Reconocer avance y motivar liderazgo.'
  }
}

export function formatMemberAcademySummary(member: {
  reviewedMaterialsCount: number
  totalMaterials: number
  testsCompleted: number
  averageScore: number | null
}): string {
  const modules = `${member.reviewedMaterialsCount}/${member.totalMaterials} módulos`
  const tests = `${member.testsCompleted} test${member.testsCompleted === 1 ? '' : 's'}`
  const score = member.averageScore !== null ? `${member.averageScore}/100` : '—'

  return `${modules} · ${tests} · ${score}`
}

export function formatMemberPlanSummary(member: {
  completedTasksCount: number
  totalTasks: number
}): string {
  return `${member.completedTasksCount}/${member.totalTasks} objetivos`
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function formatReminderDateShort(lastReminderAt: Timestamp | null): string {
  if (!lastReminderAt?.toDate) {
    return '—'
  }

  const date = lastReminderAt.toDate()

  if (isSameCalendarDay(date, new Date())) {
    return 'Hoy'
  }

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

export function resolveMemberReminderStats(
  reminders: TeamReminder[],
  memberUid: string,
): {
  lastReminderAt: Timestamp | null
  lastReminderStatus: 'unread' | 'read' | null
  remindersCount: number
  unreadRemindersCount: number
} {
  const memberReminders = reminders.filter((reminder) => reminder.recipientUid === memberUid)
  const sortedReminders = [...memberReminders].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
  const lastReminder = sortedReminders[0] ?? null

  return {
    lastReminderAt: lastReminder?.createdAt ?? null,
    lastReminderStatus: lastReminder?.status ?? null,
    remindersCount: memberReminders.length,
    unreadRemindersCount: memberReminders.filter((reminder) => reminder.status === 'unread').length,
  }
}

export function formatMemberLastReminderSummary(member: {
  remindersCount: number
  unreadRemindersCount: number
  lastReminderAt: Timestamp | null
  lastReminderStatus: 'unread' | 'read' | null
}): string {
  if (member.remindersCount === 0) {
    return 'Sin recordatorios'
  }

  if (member.remindersCount > 1 && member.unreadRemindersCount > 0) {
    return `${member.remindersCount} recordatorios · ${member.unreadRemindersCount} sin leer`
  }

  const dateLabel = formatReminderDateShort(member.lastReminderAt)
  const statusLabel = member.lastReminderStatus === 'unread' ? 'Sin leer' : 'Leído'

  return `${dateLabel} · ${statusLabel}`
}

export function getRemindersForMember(
  reminders: TeamReminder[],
  memberUid: string,
  limit = 5,
): TeamReminder[] {
  return reminders
    .filter((reminder) => reminder.recipientUid === memberUid)
    .sort((left, right) => {
      const leftTime = left.createdAt?.toMillis?.() ?? 0
      const rightTime = right.createdAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
    .slice(0, limit)
}

export function formatMemberLastActivity(lastActivityAt: Timestamp | null): string {
  if (!lastActivityAt?.toDate) {
    return 'Sin actividad'
  }

  return lastActivityAt.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function buildTeamFollowUpRadarInsight(summary: TeamProgressSummary): string {
  if (summary.totalMembers === 0 || summary.members.every((member) => member.overallStatus === 'not_started')) {
    return 'Aún no hay suficiente actividad para generar recomendaciones.'
  }

  const notStartedCount = summary.members.filter(
    (member) => member.overallStatus === 'not_started',
  ).length

  if (notStartedCount > 0) {
    const label = notStartedCount === 1 ? 'miembro' : 'miembros'
    return `Hay ${notStartedCount} ${label} que aún no han iniciado. Te recomendamos contactarlos esta semana.`
  }

  const goodCount = summary.members.filter(
    (member) =>
      member.overallStatus === 'good_progress' || member.overallStatus === 'excellent',
  ).length

  if (goodCount > summary.totalMembers / 2) {
    return 'Tu equipo muestra buen avance. Refuerza el reconocimiento y mantén el ritmo.'
  }

  return 'Aún no hay suficiente actividad para generar recomendaciones.'
}

function resolveMemberPriority(
  reviewedMaterialsCount: number,
  completedTasksCount: number,
  overallStatus: TeamMemberOverallStatus,
): TeamMemberPriority {
  if (overallStatus === 'good_progress' || overallStatus === 'excellent') {
    return 'low'
  }

  if (reviewedMaterialsCount === 0 && completedTasksCount === 0) {
    return 'high'
  }

  return 'medium'
}

function resolveMemberCombinedCompliance(
  reviewedMaterialsCount: number,
  totalMaterials: number,
  completedTasksCount: number,
  totalTasks: number,
): number {
  const academicPercent =
    totalMaterials > 0 ? (reviewedMaterialsCount / totalMaterials) * 100 : null
  const tasksPercent = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : null

  if (academicPercent !== null && tasksPercent !== null) {
    return (academicPercent + tasksPercent) / 2
  }

  if (academicPercent !== null) {
    return academicPercent
  }

  if (tasksPercent !== null) {
    return tasksPercent
  }

  return 0
}

function getPrioritySortWeight(priority: TeamMemberPriority): number {
  switch (priority) {
    case 'high':
      return 0
    case 'medium':
      return 1
    case 'low':
      return 2
  }
}

function resolveMemberDisplayInfo(
  member: TeamMember,
  attemptInfo?: { name: string; email: string },
): { memberName: string; memberEmail: string } {
  const teamName = member.memberName?.trim()
  const teamEmail = member.memberEmail?.trim()
  const attemptName = attemptInfo?.name?.trim()
  const attemptEmail = attemptInfo?.email?.trim()

  return {
    memberName: teamName || attemptName || 'Miembro del equipo',
    memberEmail: teamEmail || attemptEmail || '—',
  }
}

function resolveLatestActivity(
  attempts: AcademyTestAttempt[],
  engagements: AcademyMaterialEngagement[],
  taskProgress: ActionTaskProgress[],
): Timestamp | null {
  const timestamps: Timestamp[] = []

  for (const attempt of attempts) {
    if (attempt.submittedAt?.toMillis) {
      timestamps.push(attempt.submittedAt)
    }
  }

  for (const engagement of engagements) {
    if (engagement.lastOpenedAt?.toMillis) {
      timestamps.push(engagement.lastOpenedAt)
    }
  }

  for (const progress of taskProgress) {
    if (progress.updatedAt?.toMillis) {
      timestamps.push(progress.updatedAt)
    }
  }

  return timestamps.reduce<Timestamp | null>((latest, current) => {
    if (!latest?.toMillis) {
      return current
    }

    return current.toMillis() > latest.toMillis() ? current : latest
  }, null)
}

function resolveMemberOverallStatus(
  reviewedMaterialsCount: number,
  totalMaterials: number,
  testsCompleted: number,
  taskProgressCount: number,
  completedTasksCount: number,
  totalTasks: number,
  averageScore: number | null,
  planCompliancePercent: number,
): TeamMemberOverallStatus {
  const hasActivity =
    reviewedMaterialsCount > 0 || testsCompleted > 0 || taskProgressCount > 0

  if (!hasActivity) {
    return 'not_started'
  }

  const modulesPercent =
    totalMaterials > 0 ? (reviewedMaterialsCount / totalMaterials) * 100 : 0
  const tasksPercent = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0
  const allModulesReviewed = totalMaterials > 0 && reviewedMaterialsCount === totalMaterials
  const allTasksCompleted = totalTasks > 0 && completedTasksCount === totalTasks

  if (
    (allModulesReviewed && allTasksCompleted) ||
    (averageScore !== null && averageScore >= 80 && planCompliancePercent >= 80)
  ) {
    return 'excellent'
  }

  if (modulesPercent >= 50 || tasksPercent >= 50) {
    return 'good_progress'
  }

  return 'in_follow_up'
}

export function buildTeamProgressSummary(
  members: TeamMember[],
  materials: { id: string }[],
  attempts: AcademyTestAttempt[],
  engagements: AcademyMaterialEngagement[],
  tasks: ActionTask[],
  taskProgress: ActionTaskProgress[],
  reminders: TeamReminder[] = [],
  memberContacts: Record<string, { phone: string | null; photoURL: string | null }> = {},
): TeamProgressSummary {
  const totalMaterials = materials.length
  const totalTasks = tasks.length
  const memberInfoFromAttempts = new Map<string, { name: string; email: string }>()
  const attemptsByMember = new Map<string, AcademyTestAttempt[]>()
  const engagementsByMember = new Map<string, AcademyMaterialEngagement[]>()
  const progressByMember = new Map<string, ActionTaskProgress[]>()

  for (const attempt of attempts) {
    const memberAttempts = attemptsByMember.get(attempt.memberUid) ?? []
    memberAttempts.push(attempt)
    attemptsByMember.set(attempt.memberUid, memberAttempts)

    if (!memberInfoFromAttempts.has(attempt.memberUid)) {
      memberInfoFromAttempts.set(attempt.memberUid, {
        name: attempt.memberName,
        email: attempt.memberEmail,
      })
    }
  }

  for (const engagement of engagements) {
    const memberEngagements = engagementsByMember.get(engagement.memberUid) ?? []
    memberEngagements.push(engagement)
    engagementsByMember.set(engagement.memberUid, memberEngagements)
  }

  for (const progress of taskProgress) {
    const memberProgress = progressByMember.get(progress.memberUid) ?? []
    memberProgress.push(progress)
    progressByMember.set(progress.memberUid, memberProgress)
  }

  const memberRows = members
    .filter((member) => member.status === 'active')
    .map((member) => {
      const memberAttempts = attemptsByMember.get(member.memberUid) ?? []
      const memberEngagements = engagementsByMember.get(member.memberUid) ?? []
      const memberTaskProgress = progressByMember.get(member.memberUid) ?? []
      const reviewedMaterialIds = new Set(memberEngagements.map((item) => item.materialId))
      const reviewedMaterialsCount = reviewedMaterialIds.size
      const testsCompleted = memberAttempts.length
      const completedTasksCount = memberTaskProgress.filter(
        (item) => item.status === 'completed',
      ).length
      const planCompliancePercent =
        totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0
      const averageScore =
        testsCompleted > 0
          ? Math.round(
              memberAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / testsCompleted,
            )
          : null
      const display = resolveMemberDisplayInfo(member, memberInfoFromAttempts.get(member.memberUid))
      const contact = memberContacts[member.memberUid] ?? { phone: null, photoURL: null }
      const overallStatus = resolveMemberOverallStatus(
        reviewedMaterialsCount,
        totalMaterials,
        testsCompleted,
        memberTaskProgress.length,
        completedTasksCount,
        totalTasks,
        averageScore,
        planCompliancePercent,
      )
      const reminderStats = resolveMemberReminderStats(reminders, member.memberUid)

      return {
        memberUid: member.memberUid,
        memberName: display.memberName,
        memberEmail: display.memberEmail,
        memberPhone: contact.phone,
        memberPhotoURL: contact.photoURL,
        reviewedMaterialsCount,
        totalMaterials,
        testsCompleted,
        averageScore,
        completedTasksCount,
        totalTasks,
        planCompliancePercent,
        overallStatus,
        priority: resolveMemberPriority(
          reviewedMaterialsCount,
          completedTasksCount,
          overallStatus,
        ),
        lastActivityAt: resolveLatestActivity(
          memberAttempts,
          memberEngagements,
          memberTaskProgress,
        ),
        ...reminderStats,
      }
    })

  const membersInGoodProgress = memberRows.filter(
    (member) => member.overallStatus === 'good_progress' || member.overallStatus === 'excellent',
  ).length

  const needsFollowUp = memberRows.filter(
    (member) => member.overallStatus === 'not_started' || member.overallStatus === 'in_follow_up',
  ).length

  const generalCompliancePercent =
    memberRows.length > 0
      ? Math.round(
          memberRows.reduce(
            (sum, member) =>
              sum +
              resolveMemberCombinedCompliance(
                member.reviewedMaterialsCount,
                member.totalMaterials,
                member.completedTasksCount,
                member.totalTasks,
              ),
            0,
          ) / memberRows.length,
        )
      : 0

  const sortedMembers = [...memberRows].sort((left, right) => {
    const priorityDiff = getPrioritySortWeight(left.priority) - getPrioritySortWeight(right.priority)

    if (priorityDiff !== 0) {
      return priorityDiff
    }

    const leftTime = left.lastActivityAt?.toMillis?.() ?? 0
    const rightTime = right.lastActivityAt?.toMillis?.() ?? 0

    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return left.memberName.localeCompare(right.memberName, 'es')
  })

  return {
    totalMembers: memberRows.length,
    membersInGoodProgress,
    needsFollowUp,
    generalCompliancePercent,
    members: sortedMembers,
  }
}

export function getAttemptsForMember(
  attempts: AcademyTestAttempt[],
  memberUid: string,
): AcademyTestAttempt[] {
  return attempts
    .filter((attempt) => attempt.memberUid === memberUid)
    .sort((left, right) => {
      const leftTime = left.submittedAt?.toMillis?.() ?? 0
      const rightTime = right.submittedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

export function getEngagementsForMember(
  engagements: AcademyMaterialEngagement[],
  memberUid: string,
): AcademyMaterialEngagement[] {
  return engagements.filter((engagement) => engagement.memberUid === memberUid)
}

export function getTaskProgressForMember(
  taskProgress: ActionTaskProgress[],
  memberUid: string,
): ActionTaskProgress[] {
  return taskProgress.filter((progress) => progress.memberUid === memberUid)
}

export function buildMemberModuleProgressItems(
  materials: { id: string; title: string }[],
  memberEngagements: AcademyMaterialEngagement[],
): TeamMemberModuleProgressItem[] {
  const engagementsByMaterialId = new Map(
    memberEngagements.map((engagement) => [engagement.materialId, engagement]),
  )

  return [...materials]
    .sort((left, right) => left.title.localeCompare(right.title, 'es'))
    .map((material) => {
      const engagement = engagementsByMaterialId.get(material.id)

      return {
        materialId: material.id,
        title: material.title,
        reviewed: Boolean(engagement),
        lastOpenedAt: engagement?.lastOpenedAt ?? null,
      }
    })
}

export function buildMemberTaskProgressItems(
  tasks: ActionTask[],
  memberTaskProgress: ActionTaskProgress[],
): TeamMemberTaskProgressItem[] {
  const progressByTaskId = new Map(memberTaskProgress.map((item) => [item.taskId, item]))

  return [...tasks]
    .sort((left, right) => left.title.localeCompare(right.title, 'es'))
    .map((task) => {
      const progress = progressByTaskId.get(task.id)

      return {
        taskId: task.id,
        title: task.title,
        status: progress?.status ?? 'pending',
        updatedAt: progress?.updatedAt ?? null,
        priority: task.priority,
        dueDate: task.dueDate,
        areaTitle: task.areaTitle?.trim() || null,
      }
    })
}
