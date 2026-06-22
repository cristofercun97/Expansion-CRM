import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { AppUser, CreateAppUserInput, UpdateAppUserInput } from '@/types'
import { normalizeReferralUpline } from '@/features/referrals/utils/referralUplineUtils'
import type {
  UserPaymentSettings,
  UserProfileDetails,
} from '@/features/settings/types/user-settings.types'

function mapUserProfile(value: unknown): UserProfileDetails | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const profile = value as Record<string, unknown>

  return {
    fullName: typeof profile.fullName === 'string' ? profile.fullName : '',
    birthDate: typeof profile.birthDate === 'string' ? profile.birthDate : '',
    age: typeof profile.age === 'number' && Number.isFinite(profile.age) ? profile.age : 0,
    gender:
      profile.gender === 'mujer' ||
      profile.gender === 'hombre' ||
      profile.gender === 'prefiero_no_decir' ||
      profile.gender === 'otro'
        ? profile.gender
        : '',
    city: typeof profile.city === 'string' ? profile.city : '',
    countryCode: typeof profile.countryCode === 'string' ? profile.countryCode : '',
    countryName: typeof profile.countryName === 'string' ? profile.countryName : '',
    phone: typeof profile.phone === 'string' ? profile.phone : '',
    photoURL: typeof profile.photoURL === 'string' ? profile.photoURL : '',
  }
}

function mapPaymentSettings(value: unknown): UserPaymentSettings | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const settings = value as Record<string, unknown>
  const preferredMethod =
    settings.preferredMethod === 'bank' ||
    settings.preferredMethod === 'crypto' ||
    settings.preferredMethod === ''
      ? settings.preferredMethod
      : ''

  const bankRaw = settings.bank
  const cryptoRaw = settings.crypto

  return {
    preferredMethod,
    bank:
      bankRaw && typeof bankRaw === 'object'
        ? {
            accountType:
              (bankRaw as Record<string, unknown>).accountType === 'checking'
                ? 'checking'
                : 'savings',
            bankName:
              typeof (bankRaw as Record<string, unknown>).bankName === 'string'
                ? ((bankRaw as Record<string, unknown>).bankName as string)
                : '',
            accountNumber:
              typeof (bankRaw as Record<string, unknown>).accountNumber === 'string'
                ? ((bankRaw as Record<string, unknown>).accountNumber as string)
                : '',
            documentId:
              typeof (bankRaw as Record<string, unknown>).documentId === 'string'
                ? ((bankRaw as Record<string, unknown>).documentId as string)
                : '',
          }
        : undefined,
    crypto:
      cryptoRaw && typeof cryptoRaw === 'object'
        ? {
            asset: 'USDT',
            network:
              typeof (cryptoRaw as Record<string, unknown>).network === 'string'
                ? ((cryptoRaw as Record<string, unknown>).network as string)
                : '',
            walletAddress:
              typeof (cryptoRaw as Record<string, unknown>).walletAddress === 'string'
                ? ((cryptoRaw as Record<string, unknown>).walletAddress as string)
                : '',
          }
        : undefined,
  }
}

function mapAppUser(uid: string, data: DocumentData): AppUser {
  return {
    uid,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    phone: data.phone ?? '',
    photoURL: data.photoURL,
    profile: mapUserProfile(data.profile),
    paymentSettings: mapPaymentSettings(data.paymentSettings),
    role: data.role,
    leaderId: data.leaderId,
    homeTeamId: typeof data.homeTeamId === 'string' ? data.homeTeamId : undefined,
    ownedTeamId: typeof data.ownedTeamId === 'string' ? data.ownedTeamId : undefined,
    activationStatus:
      data.activationStatus === 'active' ||
      data.activationStatus === 'none' ||
      data.activationStatus === 'pending' ||
      data.activationStatus === 'rejected' ||
      data.activationStatus === 'expired'
        ? data.activationStatus
        : undefined,
    activationExpiresAt: data.activationExpiresAt,
    referralCode: data.referralCode,
    referralUpline: Array.isArray(data.referralUpline)
      ? normalizeReferralUpline({ rawChain: data.referralUpline, selfUid: uid })
      : undefined,
    referralUplineSource:
      data.referralUplineSource === 'invite' ||
      data.referralUplineSource === 'activation_request' ||
      data.referralUplineSource === 'backfill' ||
      data.referralUplineSource === 'fallback'
        ? data.referralUplineSource
        : undefined,
    referralUplineUpdatedAt: data.referralUplineUpdatedAt,
    status: data.status ?? 'active',
    emailVerified: Boolean(data.emailVerified),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

async function getUserById(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.users, uid))

  if (!snapshot.exists()) {
    return null
  }

  return mapAppUser(snapshot.id, snapshot.data())
}

async function getUserProfile(uid: string): Promise<AppUser | null> {
  return getUserById(uid)
}

async function createUserProfile(uid: string, data: CreateAppUserInput): Promise<void> {
  await setDoc(doc(getFirebaseDb(), COLLECTIONS.users, uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function syncOwnedTeamId(uid: string, ownedTeamId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.users, uid), {
    ownedTeamId,
    updatedAt: serverTimestamp(),
  })
}

async function updateUserProfile(uid: string, data: UpdateAppUserInput): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.users, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const usersService = {
  getUserById,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  syncOwnedTeamId,
}
