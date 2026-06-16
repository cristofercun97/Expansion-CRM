import { useEffect, useState } from 'react'
import { teamService } from '@/features/team/services/team.service'
import type { InviteValidationResult, Team } from '@/features/team/types/team.types'
import { INVALID_INVITE_CODE_MESSAGE } from '@/features/team/types/team.types'

type UseInviteValidationResult = {
  loading: boolean
  inviteCode: string | undefined
  team: Team | null
  isValid: boolean
  hasInviteParam: boolean
  message: string
}

export function useInviteValidation(rawInviteCode?: string): UseInviteValidationResult {
  const inviteCode = rawInviteCode?.trim() || undefined
  const [loading, setLoading] = useState(Boolean(inviteCode))
  const [result, setResult] = useState<InviteValidationResult | null>(null)

  useEffect(() => {
    if (!inviteCode) {
      setLoading(false)
      setResult(null)
      return
    }

    let cancelled = false

    async function validate() {
      if (!inviteCode) {
        return
      }

      setLoading(true)

      try {
        const validation = await teamService.validateInviteCode(inviteCode)
        if (!cancelled) {
          setResult(validation)
        }
      } catch {
        if (!cancelled) {
          setResult({ valid: false, message: INVALID_INVITE_CODE_MESSAGE })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void validate()

    return () => {
      cancelled = true
    }
  }, [inviteCode])

  if (!inviteCode) {
    return {
      loading: false,
      inviteCode: undefined,
      team: null,
      isValid: false,
      hasInviteParam: false,
      message: '',
    }
  }

  if (loading) {
    return {
      loading: true,
      inviteCode,
      team: null,
      isValid: false,
      hasInviteParam: true,
      message: '',
    }
  }

  if (result?.valid) {
    return {
      loading: false,
      inviteCode,
      team: result.team,
      isValid: true,
      hasInviteParam: true,
      message: `Te estás uniendo al grupo ${result.team.name}`,
    }
  }

  return {
    loading: false,
    inviteCode,
    team: null,
    isValid: false,
    hasInviteParam: true,
    message: result?.valid === false ? result.message : INVALID_INVITE_CODE_MESSAGE,
  }
}
