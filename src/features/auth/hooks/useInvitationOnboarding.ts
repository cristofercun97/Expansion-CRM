import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InvitationOnboardingType } from '@/features/auth/types/invitationOnboarding.types'
import {
  clearInvitationOnboardingSeen,
  hasSeenInvitationOnboarding,
  markInvitationOnboardingSeen,
} from '@/features/auth/utils/invitationOnboardingStorage'

type UseInvitationOnboardingInput = {
  enabled: boolean
  inviteValid: boolean
  inviteCode?: string
  teamName?: string
  recommendationValid: boolean
  recommendationCode?: string
}

declare global {
  interface Window {
    __clearExpansionOnboarding?: typeof clearInvitationOnboardingSeen
  }
}

export function useInvitationOnboarding({
  enabled,
  inviteValid,
  inviteCode,
  teamName,
  recommendationValid,
  recommendationCode,
}: UseInvitationOnboardingInput) {
  const target = useMemo(() => {
    if (inviteValid && inviteCode) {
      return {
        type: 'group' as InvitationOnboardingType,
        code: inviteCode,
        teamName,
        key: `group:${inviteCode.trim().toUpperCase()}`,
      }
    }

    if (recommendationValid && recommendationCode) {
      return {
        type: 'referral' as InvitationOnboardingType,
        code: recommendationCode,
        teamName: undefined,
        key: `referral:${recommendationCode.trim().toUpperCase()}`,
      }
    }

    return null
  }, [inviteCode, inviteValid, recommendationCode, recommendationValid, teamName])

  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__clearExpansionOnboarding = clearInvitationOnboardingSeen
    }
  }, [])

  const alreadySeen = Boolean(
    target && hasSeenInvitationOnboarding(target.type, target.code),
  )

  const open = Boolean(
    enabled && target && dismissedKey !== target.key && !alreadySeen,
  )

  const dismiss = useCallback(() => {
    if (!target) {
      return
    }

    markInvitationOnboardingSeen(target.type, target.code)
    setDismissedKey(target.key)
  }, [target])

  return {
    open,
    type: target?.type ?? 'group',
    code: target?.code,
    teamName: target?.teamName,
    instanceKey: target?.key ?? 'idle',
    complete: dismiss,
    skip: dismiss,
  }
}
