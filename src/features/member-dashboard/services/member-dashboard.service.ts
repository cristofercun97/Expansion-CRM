import { actionPlanService } from '@/features/action-plan/services/action-plan.service'
import { actionTaskProgressService } from '@/features/action-plan/services/action-task-progress.service'
import { teamActionMapReviewService } from '@/features/action-plan/services/team-action-map-review.service'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import { academyService } from '@/features/academy/services/academy.service'
import type { MemberDashboardRawData } from '@/features/member-dashboard/types/member-dashboard.types'
import { sortRemindersByCreatedAtDesc } from '@/features/member-dashboard/utils/memberDashboardUtils'
import { remindersService } from '@/features/reminders/services/reminders.service'

async function loadMemberDashboardData(
  teamId: string,
  memberUid: string,
): Promise<MemberDashboardRawData> {
  const [materials, engagements, attempts, tasks, taskProgress, reminders, latestWeeklyReview] =
    await Promise.all([
    academyService.getAcademyMaterialsByTeamId(teamId),
    academyMaterialEngagementsService.getMyEngagementsByTeamId(teamId, memberUid),
    academyTestAttemptsService.getMyAttemptsByTeamId(teamId, memberUid),
    actionPlanService.getTasksByTeamId(teamId),
    actionTaskProgressService.getMyProgressByTeamId(teamId, memberUid),
    remindersService.getMyReminders(memberUid),
    teamActionMapReviewService.getLatestTeamActionMapReview(teamId).catch(() => null),
  ])

  return {
    teamId,
    materials: materials.filter((material) => material.isActive),
    engagements,
    attempts,
    tasks,
    taskProgress,
    reminders: sortRemindersByCreatedAtDesc(reminders),
    latestWeeklyReview,
  }
}

export const memberDashboardService = {
  loadMemberDashboardData,
}
