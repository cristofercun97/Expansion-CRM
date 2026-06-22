import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { MAX_REFERRAL_LEVELS } from '@/features/referrals/constants/referralProgram.constants'
import type { ReferralRewardLevel } from '@/features/referrals/types/referral-reward.types'
import type { ReferralUplineSource } from '@/features/referrals/types/referral-upline.types'
import {
  buildReferralUplineFromInviter,
  isReferralUplineIncomplete,
  normalizeReferralUpline,
} from '@/features/referrals/utils/referralUplineUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import { usersService } from '@/services/users.service'
import type { AppUser } from '@/types'

const REFERRAL_UID_FIELDS = [
  'referredByUserId',
  'sponsorId',
  'invitedBy',
  'referredBy',
  'sponsorUid',
  'parentUid',
  'leaderId',
] as const

const TEAM_MEMBER_REFERRER_FIELDS = ['invitedByUid', 'sponsorUid', 'parentUid'] as const

function readNonEmptyUid(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readUidFromRecord(data: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const uid = readNonEmptyUid(data[key])

    if (uid) {
      return uid
    }
  }

  return null
}

function readExistingReferralUpline(profile: AppUser | Record<string, unknown> | null): string[] {
  if (!profile) {
    return []
  }

  return normalizeReferralUpline({
    rawChain: (profile as AppUser).referralUpline,
    selfUid: typeof (profile as AppUser).uid === 'string' ? (profile as AppUser).uid : undefined,
  })
}

function resolveReferrerUidFromProfileData(
  data: Record<string, unknown>,
  excludeUid: string,
): string | null {
  const referrerUid = readUidFromRecord(data, REFERRAL_UID_FIELDS)

  if (!referrerUid || referrerUid === excludeUid) {
    return null
  }

  return referrerUid
}

async function resolveReferrerUidForUser(uid: string): Promise<string | null> {
  const normalizedUid = uid.trim()

  if (!normalizedUid) {
    return null
  }

  try {
    const profile = await usersService.getUserById(normalizedUid)

    if (!profile) {
      return null
    }

    return resolveReferrerUidFromProfileData(profile as unknown as Record<string, unknown>, normalizedUid)
  } catch {
    return null
  }
}

async function resolveDirectReferrerUid(params: {
  userUid: string
  homeTeamId: string
  requestRawData?: Record<string, unknown>
  userProfile?: Record<string, unknown> | null
}): Promise<string | null> {
  const normalizedUserUid = params.userUid.trim()
  const requestData = params.requestRawData ?? {}

  const requestChain = normalizeReferralUpline({
    rawChain: requestData.referralChain,
    selfUid: normalizedUserUid,
  })

  if (requestChain.length > 0) {
    return requestChain[0] ?? null
  }

  const recommendedBy = readNonEmptyUid(requestData.recommendedBy)

  if (recommendedBy && recommendedBy !== normalizedUserUid) {
    return recommendedBy
  }

  const profileReferrer = params.userProfile
    ? resolveReferrerUidFromProfileData(params.userProfile, normalizedUserUid)
    : null

  if (profileReferrer) {
    return profileReferrer
  }

  const normalizedHomeTeamId = params.homeTeamId.trim()

  if (!normalizedHomeTeamId) {
    return null
  }

  try {
    const memberSnapshot = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.teamMembers, `${normalizedHomeTeamId}_${normalizedUserUid}`),
    )

    if (!memberSnapshot.exists()) {
      return null
    }

    const memberData = memberSnapshot.data() as Record<string, unknown>
    const memberReferrer = readUidFromRecord(memberData, TEAM_MEMBER_REFERRER_FIELDS)

    if (memberReferrer && memberReferrer !== normalizedUserUid) {
      return memberReferrer
    }

    const ownerUid = readNonEmptyUid(memberData.ownerUid)
    const memberUid = readNonEmptyUid(memberData.memberUid)

    if (ownerUid && memberUid && ownerUid !== memberUid && ownerUid !== normalizedUserUid) {
      return ownerUid
    }
  } catch {
    return null
  }

  return null
}

export async function buildReferralUplineFromLegacyFallback(params: {
  userUid: string
  homeTeamId: string
  requestRawData?: Record<string, unknown>
  userProfile?: Record<string, unknown> | null
}): Promise<string[]> {
  const normalizedUserUid = params.userUid.trim()
  const requestChain = normalizeReferralUpline({
    rawChain: params.requestRawData?.referralChain,
    selfUid: normalizedUserUid,
  })

  if (requestChain.length > 0) {
    return requestChain
  }

  const chain: string[] = []
  const seen = new Set<string>([normalizedUserUid])

  let nextReferrerUid = await resolveDirectReferrerUid(params)

  while (nextReferrerUid && chain.length < MAX_REFERRAL_LEVELS) {
    if (seen.has(nextReferrerUid)) {
      break
    }

    seen.add(nextReferrerUid)
    chain.push(nextReferrerUid)
    nextReferrerUid = await resolveReferrerUidForUser(nextReferrerUid)
  }

  return chain
}

export async function buildExpectedReferralUplineForUser(params: {
  userUid: string
  homeTeamId?: string
  userProfile?: Record<string, unknown> | null
  inviterReferralUplineFromInvite?: unknown
  directInviterUid?: string | null
}): Promise<string[]> {
  const normalizedUserUid = params.userUid.trim()
  const directInviterUid = params.directInviterUid?.trim() || null

  if (directInviterUid) {
    return buildReferralUplineFromInviter(
      directInviterUid,
      normalizedUserUid,
      params.inviterReferralUplineFromInvite,
    )
  }

  return buildReferralUplineFromLegacyFallback({
    userUid: normalizedUserUid,
    homeTeamId: params.homeTeamId?.trim() || '',
    userProfile: params.userProfile,
  })
}

export async function repairReferralUplineIfIncomplete(params: {
  uid: string
  homeTeamId?: string
  userProfile?: Record<string, unknown> | null
  source?: ReferralUplineSource
}): Promise<{ repaired: boolean; chain: string[] }> {
  const normalizedUid = params.uid.trim()
  const profile =
    params.userProfile ??
    ((await usersService.getUserById(normalizedUid)) as unknown as Record<string, unknown> | null)
  const existingChain = normalizeReferralUpline({
    rawChain: profile?.referralUpline,
    selfUid: normalizedUid,
  })
  const expectedChain = await buildReferralUplineFromLegacyFallback({
    userUid: normalizedUid,
    homeTeamId: params.homeTeamId?.trim() || readNonEmptyUid(profile?.homeTeamId) || '',
    userProfile: profile,
  })

  if (!isReferralUplineIncomplete(existingChain, expectedChain)) {
    return { repaired: false, chain: existingChain }
  }

  const userRef = doc(getFirebaseDb(), COLLECTIONS.users, normalizedUid)
  const now = serverTimestamp()

  await updateDoc(userRef, {
    referralUpline: expectedChain,
    referralUplineSource: params.source ?? 'fallback',
    referralUplineUpdatedAt: now,
    updatedAt: now,
  })

  return { repaired: true, chain: expectedChain }
}

export async function resolveReferralUplineForRecommendedRegistration(
  recommenderUid: string,
  memberUid: string,
): Promise<string[]> {
  const normalizedRecommenderUid = recommenderUid.trim()
  const normalizedMemberUid = memberUid.trim()

  if (!normalizedRecommenderUid || normalizedRecommenderUid === normalizedMemberUid) {
    return []
  }

  try {
    const recommenderProfile = await usersService.getUserById(normalizedRecommenderUid)

    return buildReferralUplineFromInviter(
      normalizedRecommenderUid,
      normalizedMemberUid,
      recommenderProfile?.referralUpline,
    )
  } catch {
    return buildReferralUplineFromInviter(normalizedRecommenderUid, normalizedMemberUid)
  }
}

export async function resolveReferralUplineForInvitedRegistration(
  inviterUid: string,
  memberUid: string,
  inviterReferralUplineFromInvite?: unknown,
): Promise<string[]> {
  const normalizedInviterUid = inviterUid.trim()
  const normalizedMemberUid = memberUid.trim()

  if (!normalizedInviterUid || normalizedInviterUid === normalizedMemberUid) {
    return []
  }

  if (inviterReferralUplineFromInvite !== undefined) {
    return buildReferralUplineFromInviter(
      normalizedInviterUid,
      normalizedMemberUid,
      inviterReferralUplineFromInvite,
    )
  }

  try {
    const inviterProfile = await usersService.getUserById(normalizedInviterUid)

    return buildReferralUplineFromInviter(
      normalizedInviterUid,
      normalizedMemberUid,
      inviterProfile?.referralUpline,
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Referral Upline] No se pudo leer referralUpline del invitador; se usa solo el invitador directo.',
        {
          inviterUid: normalizedInviterUid,
          error,
        },
      )
    }

    return buildReferralUplineFromInviter(normalizedInviterUid, normalizedMemberUid)
  }
}

export async function persistReferralUplineIfMissing(
  uid: string,
  chain: string[],
  source: ReferralUplineSource,
): Promise<boolean> {
  const normalizedUid = uid.trim()
  const normalizedChain = normalizeReferralUpline({ rawChain: chain, selfUid: normalizedUid })

  if (!normalizedUid || normalizedChain.length === 0) {
    return false
  }

  const userRef = doc(getFirebaseDb(), COLLECTIONS.users, normalizedUid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return false
  }

  const existingChain = readExistingReferralUpline(snapshot.data() as AppUser)

  if (existingChain.length > 0) {
    return false
  }

  await updateDoc(userRef, {
    referralUpline: normalizedChain,
    referralUplineSource: source,
    referralUplineUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return true
}

export async function ensureReferralUplineIfMissing(params: {
  uid: string
  homeTeamId?: string
  requestRawData?: Record<string, unknown>
  source: ReferralUplineSource
}): Promise<string[]> {
  const normalizedUid = params.uid.trim()

  if (!normalizedUid) {
    return []
  }

  let profile: AppUser | null = null

  try {
    profile = await usersService.getUserById(normalizedUid)
  } catch {
    profile = null
  }

  const existingChain = readExistingReferralUpline(profile)

  if (existingChain.length > 0) {
    return existingChain
  }

  const fallbackChain = await buildReferralUplineFromLegacyFallback({
    userUid: normalizedUid,
    homeTeamId: params.homeTeamId?.trim() || profile?.homeTeamId?.trim() || '',
    requestRawData: params.requestRawData,
    userProfile: profile ? (profile as unknown as Record<string, unknown>) : null,
  })

  if (fallbackChain.length === 0) {
    return []
  }

  try {
    await persistReferralUplineIfMissing(normalizedUid, fallbackChain, params.source)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Referral Upline] No se pudo persistir referralUpline', {
        uid: normalizedUid,
        error,
      })
    }
  }

  return fallbackChain
}

export async function syncReferralUplineForUser(uid: string): Promise<{
  uid: string
  created: boolean
  chain: string[]
}> {
  const normalizedUid = uid.trim()
  const profile = await usersService.getUserById(normalizedUid)
  const existingChain = readExistingReferralUpline(profile)

  if (existingChain.length > 0) {
    return { uid: normalizedUid, created: false, chain: existingChain }
  }

  const fallbackChain = await buildReferralUplineFromLegacyFallback({
    userUid: normalizedUid,
    homeTeamId: profile?.homeTeamId?.trim() || '',
    userProfile: profile ? (profile as unknown as Record<string, unknown>) : null,
  })

  if (fallbackChain.length === 0) {
    return { uid: normalizedUid, created: false, chain: [] }
  }

  const created = await persistReferralUplineIfMissing(normalizedUid, fallbackChain, 'backfill')

  return {
    uid: normalizedUid,
    created,
    chain: created ? fallbackChain : [],
  }
}

export function referralUplineToRewardChain(
  referralUpline: string[],
): Array<{ level: ReferralRewardLevel; beneficiaryUid: string }> {
  return referralUpline.map((beneficiaryUid, index) => ({
    level: (index + 1) as ReferralRewardLevel,
    beneficiaryUid,
  }))
}

export const referralUplineService = {
  buildReferralUplineFromLegacyFallback,
  buildExpectedReferralUplineForUser,
  resolveReferralUplineForRecommendedRegistration,
  resolveReferralUplineForInvitedRegistration,
  persistReferralUplineIfMissing,
  ensureReferralUplineIfMissing,
  repairReferralUplineIfIncomplete,
  syncReferralUplineForUser,
  referralUplineToRewardChain,
}
