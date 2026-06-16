import { doc, getDoc, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { CreateReferralCodeInput, ReferralCode } from '@/types'

function mapReferralCode(code: string, data: DocumentData): ReferralCode {
  return {
    code,
    leaderId: data.leaderId ?? '',
    uid: data.uid ?? '',
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt,
  }
}

async function getReferralCode(code: string): Promise<ReferralCode | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.referralCodes, code))

  if (!snapshot.exists()) {
    return null
  }

  return mapReferralCode(snapshot.id, snapshot.data())
}

async function createReferralCode(data: CreateReferralCodeInput): Promise<void> {
  await setDoc(doc(getFirebaseDb(), COLLECTIONS.referralCodes, data.code), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const referralCodesService = {
  getReferralCode,
  createReferralCode,
}
