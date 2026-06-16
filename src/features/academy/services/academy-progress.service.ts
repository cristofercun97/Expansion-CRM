import { academyMaterialEngagementsService } from '@/features/academy/services/academy-material-engagements.service'
import { academyTestAttemptsService } from '@/features/academy/services/academy-test-attempts.service'
import { academyTestsService } from '@/features/academy/services/academy-tests.service'
import { academyService } from '@/features/academy/services/academy.service'
import type { AcademyProgressData } from '@/features/academy/types/academy-progress.types'
import { teamService } from '@/features/team/services/team.service'

async function loadAcademyProgressData(teamId: string): Promise<AcademyProgressData> {
  const team = await teamService.getTeamById(teamId)

  if (!team) {
    throw new Error('No encontramos el equipo.')
  }

  const [members, materials, tests, attempts, engagements] = await Promise.all([
    teamService.getTeamMembersByTeamId(teamId, team.ownerUid),
    academyService.getManagedAcademyMaterials(team.ownerUid, teamId),
    academyTestsService.getAcademyTestsByTeamId(teamId),
    academyTestAttemptsService.getAttemptsByTeamId(teamId),
    academyMaterialEngagementsService.getEngagementsForLeaderProgress(teamId, team.ownerUid),
  ])

  return {
    teamId,
    members,
    materials,
    tests,
    attempts,
    engagements,
  }
}

export const academyProgressService = {
  loadAcademyProgressData,
}
