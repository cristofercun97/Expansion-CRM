import { actionPlanService } from '@/features/action-plan/services/action-plan.service'
import { actionTaskProgressService } from '@/features/action-plan/services/action-task-progress.service'
import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import { academyTestsService } from '@/features/academy/services/academy-tests.service'
import { academyService } from '@/features/academy/services/academy.service'
import { remindersService } from '@/features/reminders/services/reminders.service'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import type { TeamProgressData } from '@/features/team-progress/types/team-progress.types'
import { teamService } from '@/features/team/services/team.service'
import { buildMemberContactInfoFromUser } from '@/features/team-progress/utils/teamProgressUtils'
import { usersService } from '@/services/users.service'

async function loadTeamProgressData(teamId: string): Promise<TeamProgressData> {
  const team = await teamService.getTeamById(teamId)

  if (!team) {
    throw new Error('No encontramos el equipo.')
  }

  const [members, materials, tests, attempts, engagements, tasks, taskProgress, remindersResult, salesResult] =
    await Promise.all([
      teamService.getTeamMembersByTeamId(teamId, team.ownerUid),
      academyService.getManagedAcademyMaterials(team.ownerUid, teamId),
      academyTestsService.getAcademyTestsByTeamId(teamId),
      academyTestAttemptsService.getAttemptsByTeamId(teamId),
      academyMaterialEngagementsService.getEngagementsByTeamId(teamId),
      actionPlanService.getTasksByTeamId(teamId),
      actionTaskProgressService.getProgressByTeamId(teamId),
      remindersService.getTeamReminders(teamId).then(
        (reminders) => ({ reminders, remindersLoadError: '' }),
        () => ({
          reminders: [],
          remindersLoadError:
            'No pudimos cargar el historial de recordatorios. El resto del progreso sigue disponible.',
        }),
      ),
      (async () => {
        try {
          const salesGoal = await salesGoalService.getActiveGoalForTeam(teamId)
          const salesReports = await salesGoalService.getReportsForTeam(teamId, {
            goalId: salesGoal?.id,
            leaderView: true,
          })

          return {
            salesGoal,
            salesReports,
            salesLoadError: '',
          }
        } catch {
          return {
            salesGoal: null,
            salesReports: [],
            salesLoadError:
              'No pudimos cargar el progreso comercial. El resto del seguimiento sigue disponible.',
          }
        }
      })(),
    ])

  const memberContactsEntries = await Promise.all(
    members.map(async (member) => {
      try {
        const user = await usersService.getUserById(member.memberUid)
        return [member.memberUid, buildMemberContactInfoFromUser(user)] as const
      } catch {
        return [member.memberUid, { phone: null, photoURL: null }] as const
      }
    }),
  )

  const memberContacts = Object.fromEntries(memberContactsEntries)

  return {
    teamId,
    members,
    materials,
    tests,
    attempts,
    engagements,
    tasks,
    taskProgress,
    reminders: remindersResult.reminders,
    remindersLoadError: remindersResult.remindersLoadError,
    salesGoal: salesResult.salesGoal,
    salesReports: salesResult.salesReports,
    salesLoadError: salesResult.salesLoadError,
    memberContacts,
  }
}

export const teamProgressService = {
  loadTeamProgressData,
}
