import { useCallback, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { groupActivationService } from '@/features/group-activation/services/group-activation.service'

/**
 * ⚠️ HOOK CRÍTICO — puente entre UI (TeamActivationCard) y group-activation.service.
 * No redirigir lógica de negocio aquí; mantener en el servicio.
 */
export function useGroupActivation() {
  const { appUser, refreshUser } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const requestActivation = useCallback(async () => {
    if (!appUser) {
      throw new Error('Debes iniciar sesión para solicitar la activación.')
    }

    setSubmitting(true)

    try {
      await groupActivationService.requestGroupActivation(appUser)
      await refreshUser()
    } finally {
      setSubmitting(false)
    }
  }, [appUser, refreshUser])

  return {
    activationStatus: appUser?.activationStatus ?? 'none',
    requestActivation,
    submitting,
  }
}
