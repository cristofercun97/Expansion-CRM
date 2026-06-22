import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { generateReferralCode } from '@/features/auth/utils/generators'
import { normalizeRecommendationCodeParam } from '@/features/referrals/utils/recommendationUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import { referralCodesService } from '@/services/referral-codes.service'
import type { AppUser } from '@/types'

const MAX_CODE_ATTEMPTS = 12

export type RecommendationCodeValidation = {
  valid: boolean
  code?: string
  recommenderUserId?: string
  message?: string
}

export type RecommendationCodeRecord = {
  code: string
  recommenderUserId: string
  isActive: boolean
  createdAt: unknown
}

async function getRecommendationCodeRecord(code: string): Promise<RecommendationCodeRecord | null> {
  const normalizedCode = normalizeRecommendationCodeParam(code)

  if (!normalizedCode) {
    return null
  }

  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.recommendationCodes, normalizedCode))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    code: normalizedCode,
    recommenderUserId: typeof data.recommenderUserId === 'string' ? data.recommenderUserId : '',
    isActive: data.isActive !== false,
    createdAt: data.createdAt,
  }
}

async function codeExistsInAnyIndex(code: string): Promise<boolean> {
  const normalizedCode = normalizeRecommendationCodeParam(code)

  if (!normalizedCode) {
    return true
  }

  const [recommendationRecord, referralRecord] = await Promise.all([
    getRecommendationCodeRecord(normalizedCode),
    referralCodesService.getReferralCode(normalizedCode),
  ])

  return Boolean(recommendationRecord || referralRecord)
}

async function ensureUniqueRecommendationCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateReferralCode()
    const exists = await codeExistsInAnyIndex(code)

    if (!exists) {
      return code
    }
  }

  throw new Error('No se pudo generar un código de recomendación único. Intenta nuevamente.')
}

async function persistRecommendationCodeIndex(
  code: string,
  recommenderUserId: string,
): Promise<void> {
  const normalizedCode = normalizeRecommendationCodeParam(code)
  const normalizedUid = recommenderUserId.trim()

  if (!normalizedCode || !normalizedUid) {
    return
  }

  const existing = await getRecommendationCodeRecord(normalizedCode)

  if (existing) {
    return
  }

  await setDoc(doc(getFirebaseDb(), COLLECTIONS.recommendationCodes, normalizedCode), {
    code: normalizedCode,
    recommenderUserId: normalizedUid,
    isActive: true,
    createdAt: serverTimestamp(),
  })
}

async function validateRecommendationCode(code: string): Promise<RecommendationCodeValidation> {
  const normalizedCode = normalizeRecommendationCodeParam(code)

  if (!normalizedCode) {
    return { valid: false, message: 'El código de recomendación no es válido.' }
  }

  const recommendationRecord = await getRecommendationCodeRecord(normalizedCode)

  if (recommendationRecord?.isActive && recommendationRecord.recommenderUserId) {
    return {
      valid: true,
      code: normalizedCode,
      recommenderUserId: recommendationRecord.recommenderUserId,
    }
  }

  const referralRecord = await referralCodesService.getReferralCode(normalizedCode)

  if (referralRecord?.isActive && referralRecord.uid) {
    return {
      valid: true,
      code: normalizedCode,
      recommenderUserId: referralRecord.uid,
    }
  }

  return {
    valid: false,
    code: normalizedCode,
    message: 'Este código de recomendación no existe o ya no está activo.',
  }
}

function resolveExistingRecommendationCode(profile: AppUser | null | undefined): string | null {
  const recommendationCode = normalizeRecommendationCodeParam(profile?.recommendationCode)
  const referralCode = normalizeRecommendationCodeParam(profile?.referralCode)

  return recommendationCode ?? referralCode ?? null
}

async function ensureRecommendationCodeForUser(
  uid: string,
  profile: AppUser | null | undefined,
): Promise<string> {
  const normalizedUid = uid.trim()
  const existingCode = resolveExistingRecommendationCode(profile)

  if (existingCode) {
    await persistRecommendationCodeIndex(existingCode, normalizedUid)

    if (!profile?.recommendationCode) {
      await updateDoc(doc(getFirebaseDb(), COLLECTIONS.users, normalizedUid), {
        recommendationCode: existingCode,
        updatedAt: serverTimestamp(),
      })
    }

    return existingCode
  }

  const newCode = await ensureUniqueRecommendationCode()

  await setDoc(doc(getFirebaseDb(), COLLECTIONS.recommendationCodes, newCode), {
    code: newCode,
    recommenderUserId: normalizedUid,
    isActive: true,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.users, normalizedUid), {
    recommendationCode: newCode,
    updatedAt: serverTimestamp(),
  })

  return newCode
}

export const recommendationCodeService = {
  validateRecommendationCode,
  ensureRecommendationCodeForUser,
  persistRecommendationCodeIndex,
  ensureUniqueRecommendationCode,
  getRecommendationCodeRecord,
}
