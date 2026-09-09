import type { InvitationOnboardingType } from '@/features/auth/types/invitationOnboarding.types'

const STORAGE_PREFIX = 'expansion_onboarding'

function buildStorageKey(type: InvitationOnboardingType, code: string): string {
  const normalizedType = type === 'group' ? 'invite' : 'ref'
  const normalizedCode = code.trim().toUpperCase()
  return `${STORAGE_PREFIX}_${normalizedType}_${normalizedCode}`
}

export function hasSeenInvitationOnboarding(
  type: InvitationOnboardingType,
  code: string,
): boolean {
  if (typeof window === 'undefined' || !code.trim()) {
    return false
  }

  try {
    return window.sessionStorage.getItem(buildStorageKey(type, code)) === '1'
  } catch {
    return false
  }
}

export function markInvitationOnboardingSeen(
  type: InvitationOnboardingType,
  code: string,
): void {
  if (typeof window === 'undefined' || !code.trim()) {
    return
  }

  try {
    window.sessionStorage.setItem(buildStorageKey(type, code), '1')
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

/** Useful while developing: clear one onboarding flag from the console. */
export function clearInvitationOnboardingSeen(
  type: InvitationOnboardingType,
  code: string,
): void {
  if (typeof window === 'undefined' || !code.trim()) {
    return
  }

  try {
    window.sessionStorage.removeItem(buildStorageKey(type, code))
  } catch {
    // Ignore storage errors
  }
}
