import type { Timestamp } from 'firebase/firestore'

export type TeamRecognitionType =
  | 'commitment'
  | 'consistency'
  | 'attitude'
  | 'training'
  | 'leadership'
  | 'progress'
  | 'team_spirit'

export type TeamRecognitionVisibility = 'team' | 'private'

export type TeamRecognition = {
  id: string
  teamId: string
  senderUid: string
  senderName: string
  recipientUid: string
  recipientName: string
  recipientEmail?: string | null
  type: TeamRecognitionType
  title: string
  message: string
  visibility: TeamRecognitionVisibility
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateTeamRecognitionInput = {
  teamId: string
  senderUid: string
  senderName: string
  recipientUid: string
  recipientName: string
  recipientEmail?: string | null
  type: TeamRecognitionType
  title: string
  message: string
  visibility: TeamRecognitionVisibility
}
