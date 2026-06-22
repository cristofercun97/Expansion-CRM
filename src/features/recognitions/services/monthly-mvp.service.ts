import type { MonthlyMvpResult } from '@/features/recognitions/types/monthly-mvp.types'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import {
  calculateMonthlyMvpFromSnapshots,
  getCurrentMonthlyMvpPeriod,
} from '@/features/recognitions/utils/monthlyMvpUtils'

async function getMonthlyMvpForTeam(teamId: string): Promise<MonthlyMvpResult> {
  const normalizedTeamId = teamId.trim()
  const month = getCurrentMonthlyMvpPeriod()

  if (!normalizedTeamId) {
    return {
      monthKey: month.monthKey,
      monthLabel: month.monthLabel,
      winner: null,
      candidates: [],
      snapshotsCount: 0,
      hasEnoughData: false,
    }
  }

  const snapshots =
    await recognitionWeeklySnapshotService.listPublishedSnapshotsByTeamId(normalizedTeamId)

  return calculateMonthlyMvpFromSnapshots(snapshots, month)
}

export const monthlyMvpService = {
  getMonthlyMvpForTeam,
}
