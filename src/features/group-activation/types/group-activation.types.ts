import type { Timestamp } from 'firebase/firestore'

export type GroupActivationRequestStatus = 'pending' | 'approved' | 'rejected'

export type GroupActivationRequest = {
  id: string
  requesterUid: string
  requesterEmail: string
  requesterName: string
  currentHomeTeamId: string
  amount: number
  currency: string
  status: GroupActivationRequestStatus
  requestedAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string
  adminNote: string
}
