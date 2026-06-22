import type { Timestamp } from 'firebase/firestore'

export type RecognitionAchievementType =
  | 'recognition'
  | 'podium'
  | 'team_movement'
  | 'mvp'
  | 'personal'

export type RecognitionAchievementVisibility = 'team' | 'private'

export type RecognitionAchievement = {
  id: string
  type: RecognitionAchievementType
  title: string
  description: string
  memberName?: string
  iconType?: RecognitionAchievementType
  createdAt: Timestamp | null
  visibility: RecognitionAchievementVisibility
}

export type PositiveFomoContext = {
  viewRole: 'leader' | 'member' | 'none'
  hasPublishedRanking: boolean
  hasRecentRecognitions: boolean
}
