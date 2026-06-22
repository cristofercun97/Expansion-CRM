import { doc, getDoc, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore'
import {
  EXPANSION_ANNUAL_PRICE_EUR,
  REFERRAL_REWARD_LEVELS,
} from '@/features/referrals/constants/referralProgram.constants'
import {
  referralUplineService,
} from '@/features/referrals/services/referral-upline.service'
import type {
  CreateReferralRewardsForActivationParams,
  ReferralRewardChainEntry,
  ReferralRewardCreationResult,
  ReferralRewardLevel,
} from '@/features/referrals/types/referral-reward.types'
import {
  isReferralUplineIncomplete,
  normalizeReferralUpline,
} from '@/features/referrals/utils/referralUplineUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import { usersService } from '@/services/users.service'

export function getReferralRewardId(
  activationRequestId: string,
  level: ReferralRewardLevel,
  beneficiaryUid: string,
): string {
  return `${activationRequestId.trim()}_L${level}_${beneficiaryUid.trim()}`
}

function getReferralRewardAmountForLevel(level: ReferralRewardLevel): number | null {
  return REFERRAL_REWARD_LEVELS.find((entry) => entry.level === level)?.amount ?? null
}

export async function buildReferralRewardChainForActivation(params: {
  activatedUserUid: string
  homeTeamId: string
  requestRawData?: Record<string, unknown>
  activatedUserProfile?: Record<string, unknown> | null
}): Promise<ReferralRewardChainEntry[]> {
  const normalizedActivatedUid = params.activatedUserUid.trim()
  let activatedUserProfile = params.activatedUserProfile

  const canonicalUpline = normalizeReferralUpline({
    rawChain: activatedUserProfile?.referralUpline,
    selfUid: normalizedActivatedUid,
  })

  const fallbackUpline = await referralUplineService.buildReferralUplineFromLegacyFallback({
    userUid: normalizedActivatedUid,
    homeTeamId: params.homeTeamId,
    requestRawData: params.requestRawData,
    userProfile: activatedUserProfile,
  })

  let effectiveUpline = canonicalUpline.length > 0 ? canonicalUpline : fallbackUpline

  if (
    canonicalUpline.length > 0 &&
    isReferralUplineIncomplete(canonicalUpline, fallbackUpline) &&
    fallbackUpline.length > canonicalUpline.length
  ) {
    effectiveUpline = fallbackUpline

    try {
      await referralUplineService.repairReferralUplineIfIncomplete({
        uid: normalizedActivatedUid,
        homeTeamId: params.homeTeamId,
        userProfile: activatedUserProfile,
        source: 'fallback',
      })

      activatedUserProfile = {
        ...(activatedUserProfile ?? {}),
        referralUpline: fallbackUpline,
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Referral Rewards] No se pudo reparar referralUpline incompleta', {
          uid: normalizedActivatedUid,
          canonicalUpline,
          fallbackUpline,
          error,
        })
      }
    }
  }

  if (effectiveUpline.length > 0) {
    return referralUplineService.referralUplineToRewardChain(effectiveUpline)
  }

  if (fallbackUpline.length > 0) {
    try {
      await referralUplineService.persistReferralUplineIfMissing(
        normalizedActivatedUid,
        fallbackUpline,
        'fallback',
      )
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Referral Rewards] No se pudo persistir referralUpline desde fallback', {
          uid: normalizedActivatedUid,
          error,
        })
      }
    }
  }

  return referralUplineService.referralUplineToRewardChain(fallbackUpline)
}

async function resolveUserDisplayFields(uid: string): Promise<{ name?: string; email?: string }> {
  try {
    const profile = await usersService.getUserById(uid)

    if (!profile) {
      return {}
    }

    return {
      name: profile.displayName?.trim() || profile.email?.trim() || undefined,
      email: profile.email?.trim() || undefined,
    }
  } catch {
    return {}
  }
}

async function createReferralRewardDocument(params: {
  activationRequestId: string
  activatedUserUid: string
  activatedUserName?: string
  activatedUserEmail?: string
  beneficiaryUid: string
  level: ReferralRewardLevel
  homeTeamId: string
  ownedTeamId: string | null
  referralPath: string[]
}): Promise<'created' | 'skipped'> {
  const rewardId = getReferralRewardId(
    params.activationRequestId,
    params.level,
    params.beneficiaryUid,
  )
  const rewardRef = doc(getFirebaseDb(), COLLECTIONS.referralRewards, rewardId)
  const existingReward = await getDoc(rewardRef)

  if (existingReward.exists()) {
    return 'skipped'
  }

  const amount = getReferralRewardAmountForLevel(params.level)

  if (amount === null) {
    return 'skipped'
  }

  const beneficiaryDisplay = await resolveUserDisplayFields(params.beneficiaryUid)
  const now = serverTimestamp()

  await setDoc(rewardRef, {
    rewardId,
    activationRequestId: params.activationRequestId.trim(),
    activatedUserUid: params.activatedUserUid.trim(),
    activatedUserName: params.activatedUserName?.trim() || null,
    activatedUserEmail: params.activatedUserEmail?.trim() || null,
    beneficiaryUid: params.beneficiaryUid.trim(),
    beneficiaryName: beneficiaryDisplay.name ?? null,
    beneficiaryEmail: beneficiaryDisplay.email ?? null,
    level: params.level,
    amount,
    currency: 'EUR',
    source: 'group_activation',
    status: 'payable',
    reason: 'Recompensa generada por activación confirmada del sistema.',
    createdAt: now,
    updatedAt: now,
    payableAt: now,
    metadata: {
      activatedHomeTeamId: params.homeTeamId.trim() || null,
      activatedOwnedTeamId: params.ownedTeamId?.trim() || null,
      referralPath: params.referralPath,
    },
  })

  return 'created'
}

export async function createReferralRewardsForActivation(
  params: CreateReferralRewardsForActivationParams,
): Promise<ReferralRewardCreationResult> {
  const result: ReferralRewardCreationResult = {
    activationRequestId: params.activationRequestId,
    activatedUserUid: params.activatedUserUid,
    chainLength: 0,
    rewardsCreated: 0,
    rewardsSkipped: 0,
    rewardIds: [],
    warnings: [],
  }

  if (params.amount !== EXPANSION_ANNUAL_PRICE_EUR || params.currency.trim() !== 'EUR') {
    result.warnings.push(
      'No se generaron recompensas: la activación no corresponde al acceso anual confirmado de 160 EUR.',
    )
    return result
  }

  let activatedUserProfile: Record<string, unknown> | null = null

  try {
    const profile = await usersService.getUserById(params.activatedUserUid.trim())
    activatedUserProfile = profile ? (profile as unknown as Record<string, unknown>) : null
  } catch {
    activatedUserProfile = null
  }

  if (!normalizeReferralUpline({
    rawChain: activatedUserProfile?.referralUpline,
    selfUid: params.activatedUserUid,
  }).length) {
    try {
      await referralUplineService.ensureReferralUplineIfMissing({
        uid: params.activatedUserUid,
        homeTeamId: params.homeTeamId,
        requestRawData: params.requestRawData,
        source: 'activation_request',
      })

      const refreshedProfile = await usersService.getUserById(params.activatedUserUid.trim())
      activatedUserProfile = refreshedProfile
        ? (refreshedProfile as unknown as Record<string, unknown>)
        : activatedUserProfile
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Referral Rewards] No se pudo asegurar referralUpline antes de recompensas', {
          uid: params.activatedUserUid,
          error,
        })
      }
    }
  }

  const chain = await buildReferralRewardChainForActivation({
    activatedUserUid: params.activatedUserUid,
    homeTeamId: params.homeTeamId,
    requestRawData: params.requestRawData,
    activatedUserProfile,
  })

  result.chainLength = chain.length

  if (chain.length === 0) {
    result.warnings.push('No se encontró cadena de recomendación válida para esta activación.')
    return result
  }

  const referralPath = chain.map((entry) => entry.beneficiaryUid)

  for (const entry of chain) {
    const rewardId = getReferralRewardId(params.activationRequestId, entry.level, entry.beneficiaryUid)

    try {
      const writeResult = await createReferralRewardDocument({
        activationRequestId: params.activationRequestId,
        activatedUserUid: params.activatedUserUid,
        activatedUserName: params.activatedUserName,
        activatedUserEmail: params.activatedUserEmail,
        beneficiaryUid: entry.beneficiaryUid,
        level: entry.level,
        homeTeamId: params.homeTeamId,
        ownedTeamId: params.ownedTeamId,
        referralPath,
      })

      if (writeResult === 'created') {
        result.rewardsCreated += 1
        result.rewardIds.push(rewardId)
      } else {
        result.rewardsSkipped += 1
        result.rewardIds.push(rewardId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      result.warnings.push(
        `No se pudo crear recompensa ${rewardId}: ${message}`,
      )
    }
  }

  return result
}

function mapReferralRewardDocument(rewardId: string, data: DocumentData) {
  return {
    rewardId,
    activationRequestId: typeof data.activationRequestId === 'string' ? data.activationRequestId : '',
    activatedUserUid: typeof data.activatedUserUid === 'string' ? data.activatedUserUid : '',
    beneficiaryUid: typeof data.beneficiaryUid === 'string' ? data.beneficiaryUid : '',
    level: data.level === 1 || data.level === 2 || data.level === 3 ? data.level : 1,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: data.currency === 'EUR' ? 'EUR' : 'EUR',
    source: data.source === 'group_activation' ? 'group_activation' : 'group_activation',
    status: data.status ?? 'pending',
  }
}

/** @deprecated Use normalizeReferralUpline from referralUplineUtils */
export function normalizeReferralChain(chain: unknown, excludeUid?: string): string[] {
  return normalizeReferralUpline({ rawChain: chain, selfUid: excludeUid })
}

export const referralRewardsService = {
  buildReferralRewardChainForActivation,
  createReferralRewardsForActivation,
  getReferralRewardId,
  normalizeReferralChain,
  mapReferralRewardDocument,
}
