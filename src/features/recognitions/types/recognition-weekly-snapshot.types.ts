import type { Timestamp } from 'firebase/firestore'

export type RecognitionSnapshotBreakdownPublic = {
  academyPoints: number
  taskPoints: number
  reminderPoints: number
  bonusPoints: number
  salesPoints: number
  validatedSalesAmount: number
  validatedSalesCount: number
  salesBonusPoints: number
}

export type RecognitionSnapshotEntry = {
  memberUid: string
  memberName: string
  score: number
  position: number
  summary: string
}

export type RecognitionSnapshotRankingEntry = RecognitionSnapshotEntry & {
  breakdownPublic: RecognitionSnapshotBreakdownPublic
}

export type RecognitionWeeklySnapshot = {
  id: string
  teamId: string
  weekKey: string
  weekLabel: string
  weekStartDate: string
  weekEndDate: string
  generatedByUid: string
  generatedAt: Timestamp | null
  podium: RecognitionSnapshotEntry[]
  ranking: RecognitionSnapshotRankingEntry[]
  isPublished: boolean
}

export type PublishRecognitionWeeklySnapshotInput = {
  teamId: string
  weekKey: string
  weekLabel: string
  weekStartDate: string
  weekEndDate: string
  generatedByUid: string
  podium: RecognitionSnapshotEntry[]
  ranking: RecognitionSnapshotRankingEntry[]
}
