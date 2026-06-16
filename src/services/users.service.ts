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

function mapAppUser(uid: string, data: DocumentData): AppUser {
  return {
    uid,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    phone: data.phone ?? '',
    photoURL: data.photoURL,
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
