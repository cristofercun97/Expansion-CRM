import type { Timestamp } from 'firebase/firestore'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import type { TeamMember } from '@/features/team/types/team.types'

export type AcademyMemberProgressStatus = 'none' | 'in_progress' | 'good'

export type AcademyMemberStudyStatus = 'not_started' | 'reviewing' | 'studied' | 'good_progress'

export type AcademyMemberProgressRow = {
  memberUid: string
  memberName: string
  memberEmail: string
  role: TeamMember['role']
  testsCompleted: number
  averageScore: number | null
  reviewedMaterialsCount: number
  totalMaterials: number
  studyProgressLabel: string
  studyProgressPercent: number
  studyStatus: AcademyMemberStudyStatus
  lastActivityAt: Timestamp | null
  status: AcademyMemberProgressStatus
}

export type AcademyMemberModuleProgressItem = {
  materialId: string
  title: string
  reviewed: boolean
  lastOpenedAt: Timestamp | null
  openCount: number
}

export type AcademyProgressSummary = {
  totalMembers: number
  totalMaterials: number
  totalModulesReviewed: number
  membersNotReviewedModules: number
  totalAttempts: number
  averageScore: number | null
  membersStudied: number
  membersNotStudied: number
  members: AcademyMemberProgressRow[]
}

export type AcademyProgressData = {
  teamId: string
  members: TeamMember[]
  materials: AcademyMaterial[]
  tests: AcademyTest[]
  attempts: AcademyTestAttempt[]
  engagements: AcademyMaterialEngagement[]
}
