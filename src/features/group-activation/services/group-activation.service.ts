import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import {
  GROUP_ACTIVATION_AMOUNT,
  GROUP_ACTIVATION_CURRENCY,
} from '@/features/group-activation/constants/groupActivation.constants'
import type { GroupActivationRequest } from '@/features/group-activation/types/group-activation.types'
import { referralRewardsService } from '@/features/referrals/services/referral-rewards.service'
import { referralUplineService } from '@/features/referrals/services/referral-upline.service'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { AppUser } from '@/types'

/**
 * ⚠️ MÓDULO CRÍTICO — ACTIVACIÓN DE GRUPO (UPGRADE 160€/año)
 *
 * NO modificar sin revisar también:
 * - firestore.rules → isValidGroupActivationRequestCreate / isValidGroupActivationRequestReview
 * - firestore.rules → isValidUserActivationStatusSelfUpdate
 * - TeamActivationCard + useGroupActivation (flujo del usuario)
 * - AdminActivationRequestsPanel (listado admin)
 *
 * Flujo esperado:
 * 1. Usuario solicita → crea doc en groupActivationRequests + users.activationStatus = pending
 * 2. Admin lista solicitudes pending → aprueba/rechaza
 * 3. Aprobación → users.activationStatus = active + ownedTeamId (conserva homeTeamId)
 *
 * Si el admin ve "No hay solicitudes" pero el usuario ve "En revisión", revisar Firestore
 * directamente: colección groupActivationRequests y reglas desplegadas.
 */

function resolveRequesterName(appUser: AppUser): string {
  const displayName = appUser.displayName?.trim() ?? ''
  const email = appUser.email?.trim() ?? ''

  if (displayName.length > 0) {
    return displayName
  }

  if (email.length > 0) {
    return email
  }

  return 'Usuario'
}

function mapGroupActivationRequest(id: string, data: DocumentData): GroupActivationRequest {
  return {
    id,
    requesterUid: typeof data.requesterUid === 'string' ? data.requesterUid : '',
    requesterEmail: typeof data.requesterEmail === 'string' ? data.requesterEmail : '',
    requesterName: typeof data.requesterName === 'string' ? data.requesterName : '',
    currentHomeTeamId: typeof data.currentHomeTeamId === 'string' ? data.currentHomeTeamId : '',
    amount: typeof data.amount === 'number' ? data.amount : GROUP_ACTIVATION_AMOUNT,
    currency: typeof data.currency === 'string' ? data.currency : GROUP_ACTIVATION_CURRENCY,
    status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
    requestedAt: data.requestedAt ?? null,
    reviewedAt: data.reviewedAt ?? null,
    reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : '',
    adminNote: typeof data.adminNote === 'string' ? data.adminNote : '',
  }
}

function getActivationExpiryTimestamp(): Timestamp {
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)
  return Timestamp.fromDate(expiryDate)
}

function resolveRequesterDisplayName(request: GroupActivationRequest): string {
  const requesterName = request.requesterName.trim()

  if (requesterName) {
    return requesterName
  }

  return request.requesterEmail.trim() || 'Usuario'
}

async function getPendingRequestByUser(uid: string): Promise<GroupActivationRequest | null> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.groupActivationRequests),
      where('requesterUid', '==', uid),
      where('status', '==', 'pending'),
    ),
  )

  const requestDoc = snapshot.docs[0]

  if (!requestDoc) {
    return null
  }

  return mapGroupActivationRequest(requestDoc.id, requestDoc.data())
}

async function listPendingActivationRequests(): Promise<GroupActivationRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.groupActivationRequests),
      where('status', '==', 'pending'),
    ),
  )

  return snapshot.docs
    .map((requestDoc) => mapGroupActivationRequest(requestDoc.id, requestDoc.data()))
    .sort((left, right) => {
      const leftTime = left.requestedAt?.toMillis?.() ?? 0
      const rightTime = right.requestedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

async function requestGroupActivation(appUser: AppUser): Promise<void> {
  if (appUser.activationStatus === 'active') {
    throw new Error('Tu grupo ya está activado.')
  }

  if (appUser.activationStatus === 'pending') {
    throw new Error('Ya tienes una solicitud en revisión.')
  }

  const existingPendingRequest = await getPendingRequestByUser(appUser.uid)

  if (existingPendingRequest) {
    throw new Error('Ya tienes una solicitud en revisión.')
  }

  const requesterName = resolveRequesterName(appUser)

  try {
    await referralUplineService.ensureReferralUplineIfMissing({
      uid: appUser.uid,
      homeTeamId: appUser.homeTeamId,
      source: 'activation_request',
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Group Activation] No se pudo asegurar referralUpline al solicitar activación', {
        uid: appUser.uid,
        error,
      })
    }
  }

  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const requestRef = doc(collection(db, COLLECTIONS.groupActivationRequests))
  const now = serverTimestamp()

  // ⚠️ CRÍTICO: payload debe coincidir EXACTAMENTE con isValidGroupActivationRequestCreate en firestore.rules
  batch.set(requestRef, {
    requesterUid: appUser.uid,
    requesterEmail: appUser.email,
    requesterName,
    currentHomeTeamId: appUser.homeTeamId ?? '',
    amount: GROUP_ACTIVATION_AMOUNT,
    currency: GROUP_ACTIVATION_CURRENCY,
    status: 'pending',
    requestedAt: now,
  })

  // ⚠️ CRÍTICO: batch atómico — si falla users.update, tampoco se crea la solicitud
  batch.update(doc(db, COLLECTIONS.users, appUser.uid), {
    activationStatus: 'pending',
    updatedAt: now,
  })

  await batch.commit()
}

async function resolveOwnedTeamIdForApproval(requesterUid: string): Promise<string | null> {
  const userSnapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.users, requesterUid))

  if (!userSnapshot.exists()) {
    throw new Error('No encontramos el perfil del solicitante.')
  }

  const userData = userSnapshot.data()
  const existingOwnedTeamId =
    typeof userData.ownedTeamId === 'string' && userData.ownedTeamId.length > 0
      ? userData.ownedTeamId
      : ''

  if (existingOwnedTeamId) {
    const ownedTeam = await teamService.getTeamById(existingOwnedTeamId)

    if (ownedTeam) {
      return existingOwnedTeamId
    }
  }

  const legacyOwnedTeam = await teamService.getMyTeam(requesterUid)

  if (legacyOwnedTeam) {
    return legacyOwnedTeam.id
  }

  return null
}

async function approveActivationRequest(requestId: string, adminUid: string): Promise<void> {
  const db = getFirebaseDb()
  const requestRef = doc(db, COLLECTIONS.groupActivationRequests, requestId)
  const requestSnapshot = await getDoc(requestRef)

  if (!requestSnapshot.exists()) {
    throw new Error('No encontramos la solicitud de activación.')
  }

  const request = mapGroupActivationRequest(requestSnapshot.id, requestSnapshot.data())

  if (request.status !== 'pending') {
    throw new Error('Esta solicitud ya fue revisada.')
  }

  const batch = writeBatch(db)
  const now = serverTimestamp()
  const expiry = getActivationExpiryTimestamp()
  const userRef = doc(db, COLLECTIONS.users, request.requesterUid)
  const existingOwnedTeamId = await resolveOwnedTeamIdForApproval(request.requesterUid)

  batch.update(requestRef, {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: adminUid,
  })

  const userUpdate: Record<string, unknown> = {
    activationStatus: 'active',
    activationExpiresAt: expiry,
    updatedAt: now,
  }

  let finalOwnedTeamId = existingOwnedTeamId

  if (existingOwnedTeamId) {
    userUpdate.ownedTeamId = existingOwnedTeamId
  } else {
    const displayName = resolveRequesterDisplayName(request)
    finalOwnedTeamId = await teamService.appendOwnedTeamToBatch(
      batch,
      request.requesterUid,
      displayName,
      now,
    )
    userUpdate.ownedTeamId = finalOwnedTeamId
  }

  const homeTeamId = request.currentHomeTeamId.trim()

  if (homeTeamId && finalOwnedTeamId) {
    batch.update(doc(db, COLLECTIONS.teamMembers, `${homeTeamId}_${request.requesterUid}`), {
      ownedTeamId: finalOwnedTeamId,
      activationStatus: 'active',
      updatedAt: now,
    })
  }

  batch.update(userRef, userUpdate)

  await batch.commit()

  try {
    const rewardResult = await referralRewardsService.createReferralRewardsForActivation({
      activationRequestId: request.id,
      activatedUserUid: request.requesterUid,
      activatedUserName: request.requesterName,
      activatedUserEmail: request.requesterEmail,
      amount: request.amount,
      currency: request.currency,
      homeTeamId: request.currentHomeTeamId,
      ownedTeamId: finalOwnedTeamId,
      requestRawData: requestSnapshot.data() as Record<string, unknown>,
    })

    if (import.meta.env.DEV && rewardResult.warnings.length > 0) {
      console.warn('[Referral Rewards] Activación aprobada con avisos de recompensa', rewardResult)
    }
  } catch (error) {
    console.warn('[Referral Rewards] No se pudieron generar recompensas tras aprobar activación', {
      activationRequestId: request.id,
      activatedUserUid: request.requesterUid,
      error,
    })
  }
}

async function rejectActivationRequest(
  requestId: string,
  adminUid: string,
  adminNote = '',
): Promise<void> {
  const db = getFirebaseDb()
  const requestRef = doc(db, COLLECTIONS.groupActivationRequests, requestId)
  const requestSnapshot = await getDoc(requestRef)

  if (!requestSnapshot.exists()) {
    throw new Error('No encontramos la solicitud de activación.')
  }

  const request = mapGroupActivationRequest(requestSnapshot.id, requestSnapshot.data())

  if (request.status !== 'pending') {
    throw new Error('Esta solicitud ya fue revisada.')
  }

  const batch = writeBatch(db)
  const now = serverTimestamp()

  batch.update(requestRef, {
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: adminUid,
    adminNote: adminNote.trim(),
  })

  batch.update(doc(db, COLLECTIONS.users, request.requesterUid), {
    activationStatus: 'rejected',
    updatedAt: now,
  })

  await batch.commit()
}

export const groupActivationService = {
  getPendingRequestByUser,
  listPendingActivationRequests,
  requestGroupActivation,
  approveActivationRequest,
  rejectActivationRequest,
}
