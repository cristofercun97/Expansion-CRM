import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { recommendationCodeService } from '@/features/referrals/services/recommendation-code.service'
import { normalizeRecommendationCodeParam } from '@/features/referrals/utils/recommendationUtils'

export function useRecommendationCode() {
  const { appUser, currentUser } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [ensuring, setEnsuring] = useState(false)

  useEffect(() => {
    const existing =
      normalizeRecommendationCodeParam(appUser?.recommendationCode) ??
      normalizeRecommendationCodeParam(appUser?.referralCode)

    setCode(existing ?? null)
  }, [appUser?.recommendationCode, appUser?.referralCode])

  const ensureCode = useCallback(async (): Promise<string | null> => {
    if (code) {
      return code
    }

    if (!currentUser || !appUser) {
      return null
    }

    setEnsuring(true)

    try {
      const ensured = await recommendationCodeService.ensureRecommendationCodeForUser(
        currentUser.uid,
        appUser,
      )
      setCode(ensured)
      return ensured
    } catch {
      return null
    } finally {
      setEnsuring(false)
    }
  }, [appUser, code, currentUser])

  return {
    code,
    ensuring,
    ensureCode,
  }
}
