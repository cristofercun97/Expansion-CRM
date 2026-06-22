import { useEffect, useState } from 'react'
import { recommendationCodeService } from '@/features/referrals/services/recommendation-code.service'
import { normalizeRecommendationCodeParam } from '@/features/referrals/utils/recommendationUtils'

export type RecommendationValidationState = {
  loading: boolean
  hasRefParam: boolean
  isValid: boolean
  recommendationCode?: string
  recommenderUserId?: string
  message?: string
}

const INITIAL_STATE: RecommendationValidationState = {
  loading: false,
  hasRefParam: false,
  isValid: false,
}

export function useRecommendationValidation(
  recommendationCodeParam: string | undefined,
): RecommendationValidationState {
  const [state, setState] = useState<RecommendationValidationState>(INITIAL_STATE)

  useEffect(() => {
    const normalizedCode = normalizeRecommendationCodeParam(recommendationCodeParam)

    if (!normalizedCode) {
      setState(INITIAL_STATE)
      return
    }

    let cancelled = false

    setState({
      loading: true,
      hasRefParam: true,
      isValid: false,
      recommendationCode: normalizedCode,
    })

    void recommendationCodeService
      .validateRecommendationCode(normalizedCode)
      .then((result) => {
        if (cancelled) {
          return
        }

        setState({
          loading: false,
          hasRefParam: true,
          isValid: result.valid,
          recommendationCode: result.code ?? normalizedCode,
          recommenderUserId: result.recommenderUserId,
          message: result.message,
        })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setState({
          loading: false,
          hasRefParam: true,
          isValid: false,
          recommendationCode: normalizedCode,
          message: 'No pudimos validar el código de recomendación.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [recommendationCodeParam])

  return state
}
