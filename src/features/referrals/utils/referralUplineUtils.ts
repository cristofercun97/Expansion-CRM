import { MAX_REFERRAL_LEVELS } from '@/features/referrals/constants/referralProgram.constants'

const FIREBASE_UID_PATTERN = /^[a-zA-Z0-9]{20,128}$/

export type NormalizeReferralUplineParams = {
  rawChain: unknown
  selfUid?: string
}

function readNonEmptyUid(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isLikelyFirebaseUid(value: string): boolean {
  return FIREBASE_UID_PATTERN.test(value)
}

export function normalizeReferralUpline(params: NormalizeReferralUplineParams): string[] {
  const { rawChain, selfUid } = params
  const normalizedSelfUid = selfUid?.trim() || null

  if (!Array.isArray(rawChain)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of rawChain) {
    const uid = readNonEmptyUid(item)

    if (!uid || !isLikelyFirebaseUid(uid)) {
      continue
    }

    if (normalizedSelfUid && uid === normalizedSelfUid) {
      continue
    }

    if (seen.has(uid)) {
      continue
    }

    seen.add(uid)
    result.push(uid)

    if (result.length >= MAX_REFERRAL_LEVELS) {
      break
    }
  }

  return result
}

export function isValidReferralUpline(chain: string[], selfUid: string): boolean {
  const normalized = normalizeReferralUpline({ rawChain: chain, selfUid })

  if (normalized.length === 0) {
    return false
  }

  return normalized.length === chain.length && normalized.every((uid, index) => uid === chain[index])
}

export function buildReferralUplineFromInviter(
  inviterUid: string,
  selfUid: string,
  inviterReferralUpline?: unknown,
): string[] {
  const normalizedInviterUid = inviterUid.trim()

  if (!normalizedInviterUid || normalizedInviterUid === selfUid.trim()) {
    return []
  }

  const inviterUpline = normalizeReferralUpline({
    rawChain: inviterReferralUpline,
    selfUid,
  })

  return normalizeReferralUpline({
    rawChain: [normalizedInviterUid, ...inviterUpline.slice(0, MAX_REFERRAL_LEVELS - 1)],
    selfUid,
  })
}

export function isReferralUplineIncomplete(
  existing: string[],
  expected: string[],
): boolean {
  if (expected.length === 0) {
    return false
  }

  if (existing.length === 0) {
    return true
  }

  if (existing.length > expected.length) {
    return false
  }

  return expected
    .slice(0, existing.length)
    .every((uid, index) => existing[index] === uid) && existing.length < expected.length
}

export function isReferralUplinePrefixMatch(existing: string[], expected: string[]): boolean {
  if (existing.length === 0 || expected.length === 0) {
    return false
  }

  const compareLength = Math.min(existing.length, expected.length)

  for (let index = 0; index < compareLength; index += 1) {
    if (existing[index] !== expected[index]) {
      return false
    }
  }

  return true
}
