import type { Timestamp } from 'firebase/firestore'

export type GroupActivationRequestStatus = 'pending' | 'approved' | 'rejected'

export type GroupActivationPaymentMethod = 'paypal' | 'usdt_trc20'

export type GroupActivationRequest = {
  id: string
  requesterUid: string
  requesterEmail: string
  requesterName: string
  currentHomeTeamId: string
  amount: number
  currency: string
  status: GroupActivationRequestStatus
  paymentMethod: GroupActivationPaymentMethod | null
  paymentReference: string
  proofUrl: string
  proofFileName: string
  proofContentType: string
  cryptoCurrency: string | null
  cryptoNetwork: string | null
  cryptoAddress: string | null
  requestedAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string
  adminNote: string
}

export type RequestGroupActivationInput = {
  paymentMethod: GroupActivationPaymentMethod
  paymentReference: string
  proofFile: File
}
