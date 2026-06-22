import type { Timestamp } from 'firebase/firestore'
import type { TeamMapStatus } from '@/features/action-plan/types/team-action-map.types'

export type TeamActionMapReviewWeeklyStatus = TeamMapStatus

export type TeamActionMapReview = {
  id: string
  teamId: string
  roadmapId: string
  ownerUid: string
  weekLabel: string
  weekStartDate: string | null
  weekEndDate: string | null
  progressSummary: string
  blockers: string
  nextAdjustments: string
  weeklyStatus: TeamActionMapReviewWeeklyStatus
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateTeamActionMapReviewInput = {
  teamId: string
  roadmapId: string
  ownerUid: string
  weekLabel: string
  weekStartDate?: string | null
  weekEndDate?: string | null
  progressSummary: string
  blockers: string
  nextAdjustments: string
  weeklyStatus: TeamActionMapReviewWeeklyStatus
}

export type UpdateTeamActionMapReviewInput = {
  weekLabel: string
  weekStartDate?: string | null
  weekEndDate?: string | null
  progressSummary: string
  blockers: string
  nextAdjustments: string
  weeklyStatus: TeamActionMapReviewWeeklyStatus
}
