import type { Timestamp } from 'firebase/firestore'

export type RecognitionMonthlyPrizes = {
  id: string
  teamId: string
  ownerUid: string
  firstPrize: string
  secondPrize: string
  thirdPrize: string
  isActive: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type UpsertRecognitionMonthlyPrizesInput = {
  teamId: string
  ownerUid: string
  firstPrize: string
  secondPrize: string
  thirdPrize: string
}
