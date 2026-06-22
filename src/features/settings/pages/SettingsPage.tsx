import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection'
import { PaymentSettingsSection } from '@/features/settings/components/PaymentSettingsSection'
import { ProfileSettingsSection } from '@/features/settings/components/ProfileSettingsSection'
import { uploadUserAvatar } from '@/features/settings/services/user-avatar.service'
import { saveUserSettings } from '@/features/settings/services/user-settings.service'
import type { UserSettingsFormState } from '@/features/settings/types/user-settings.types'
import {
  createUserSettingsFormState,
  validatePaymentSettingsForm,
  validateProfileForm,
} from '@/features/settings/utils/userSettings.utils'

export function SettingsPage() {
  const { appUser, currentUser, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [formState, setFormState] = useState<UserSettingsFormState>(() =>
    createUserSettingsFormState(appUser),
  )
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    setFormState(createUserSettingsFormState(appUser))
  }, [appUser])

  async function handleAvatarSelect(file: File) {
    const uid = currentUser?.uid ?? appUser?.uid

    if (!uid) {
      throw new Error('No hay una sesión activa.')
    }

    setAvatarUploading(true)

    try {
      const photoURL = await uploadUserAvatar(uid, file)
      setFormState((current) => ({
        ...current,
        profile: {
          ...current.profile,
          photoURL,
        },
      }))
      showToast('Foto de perfil subida. Recuerda guardar los cambios.', 'success')
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSave() {
    const uid = currentUser?.uid ?? appUser?.uid

    if (!uid) {
      showToast('No hay una sesión activa.', 'info')
      return
    }

    const nextProfileErrors = validateProfileForm(formState.profile)
    const nextPaymentErrors = validatePaymentSettingsForm(formState.paymentSettings)

    setProfileErrors(nextProfileErrors)
    setPaymentErrors(nextPaymentErrors)

    if (Object.keys(nextProfileErrors).length > 0 || Object.keys(nextPaymentErrors).length > 0) {
      showToast('Revisa los campos marcados antes de guardar.', 'info')
      return
    }

    setSaving(true)

    try {
      await saveUserSettings(uid, currentUser, formState)
      await refreshUser()
      showToast('Configuración guardada correctamente.', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No pudimos guardar tu configuración.',
        'info',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden px-4 py-5 pb-8 sm:space-y-6 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-hero-text sm:text-3xl">
          Configuración
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-hero-text/70 sm:text-base">
          Gestiona tu cuenta, perfil y método de pago.
        </p>
      </header>

      <div className="space-y-5">
        <AccountSettingsSection />

        <ProfileSettingsSection
          profile={formState.profile}
          errors={profileErrors}
          avatarUploading={avatarUploading}
          onProfileChange={(profile) => setFormState((current) => ({ ...current, profile }))}
          onAvatarSelect={handleAvatarSelect}
        />

        <PaymentSettingsSection
          paymentSettings={formState.paymentSettings}
          errors={paymentErrors}
          onPaymentSettingsChange={(paymentSettings) =>
            setFormState((current) => ({ ...current, paymentSettings }))
          }
        />
      </div>

      <div className="border-t border-white/10 pt-4 lg:border-0 lg:pt-6">
        <Button
          onClick={handleSave}
          disabled={saving || avatarUploading}
          className="w-full bg-gold text-petrol-deep hover:bg-gold-light sm:w-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
