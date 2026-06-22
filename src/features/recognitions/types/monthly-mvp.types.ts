export type MonthlyMvpCandidate = {
  memberUid: string
  memberName: string
  totalMonthlyPoints: number
  weeksInPodium: number
  weeksWithActivity: number
  bestWeeklyPosition: number | null
  weeklyAppearances: number
  publicSummary: string
}

export type MonthlyMvpWinner = MonthlyMvpCandidate

export type MonthlyMvpMonthPeriod = {
  monthKey: string
  monthLabel: string
  monthStartIso: string
  monthEndIso: string
  startMs: number
  endMs: number
}

export type MonthlyMvpResult = {
  monthKey: string
  monthLabel: string
  winner: MonthlyMvpWinner | null
  candidates: MonthlyMvpCandidate[]
  snapshotsCount: number
  hasEnoughData: boolean
}
