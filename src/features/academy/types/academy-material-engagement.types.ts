import type { Timestamp } from 'firebase/firestore'

export type AcademyMaterialEngagement = {
  id: string
  teamId: string
  materialId: string
  memberUid: string
  memberName: string
  memberEmail: string
  openedAt: Timestamp | null
  lastOpenedAt: Timestamp | null
  openCount: number
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type TrackMaterialOpenInput = {
  teamId: string
  materialId: string
  memberUid: string
  memberName: string
  memberEmail: string
}

export type TrackMaterialOpenResult = {
  tracked: boolean
  isFirstOpen: boolean
}

export type MaterialEngagementTrackingContext = {
  memberUid: string
  memberName: string
  memberEmail: string
}
