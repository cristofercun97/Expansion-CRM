import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { authService, userHasPasswordProvider } from '@/features/auth/services/auth.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SettingsField, SettingsInput } from '@/features/settings/components/SettingsField'
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard'

export function AccountSettingsSection() {
  const { currentUser } = useAuth()
  const canUsePasswordAuth = userHasPasswordProvider(currentUser)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailError, setEmailError] = useState('')

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setPasswordSaving(true)

    try {
      await authService.changePasswordWithReauth(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Contraseña actualizada correctamente.')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'No pudimos cambiar la contraseña.')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailMessage('')
    setEmailError('')

    setEmailSaving(true)

    try {
      await authService.changeEmailWithReauth(currentPassword, newEmail)
      setEmailMessage('Te enviamos un correo de verificación a la nueva dirección. Confírmalo para completar el cambio.')
      setNewEmail('')
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'No pudimos iniciar el cambio de correo.')
    } finally {
      setEmailSaving(false)
    }
  }

  return (
    <SettingsSectionCard
      title="Cuenta"
      description="Protege tu acceso y mantén tu correo actualizado."
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/75">
          Correo actual: <span className="font-medium text-hero-text">{currentUser?.email ?? '—'}</span>
        </div>

        {!canUsePasswordAuth ? (
          <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Tu cuenta usa inicio con Google. El cambio de contraseña y correo está disponible para cuentas con correo y contraseña.
          </p>
        ) : (
          <>
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <h3 className="text-sm font-semibold text-gold-light">Cambiar contraseña</h3>

              <SettingsField label="Contraseña actual">
                <SettingsInput
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </SettingsField>

              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Nueva contraseña">
                  <SettingsInput
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </SettingsField>

                <SettingsField label="Confirmar contraseña">
                  <SettingsInput
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </SettingsField>
              </div>

              {passwordError ? <p className="text-sm text-red-300">{passwordError}</p> : null}
              {passwordMessage ? <p className="text-sm text-teal-accent">{passwordMessage}</p> : null}

              <Button type="submit" disabled={passwordSaving} className="bg-gold text-petrol-deep hover:bg-gold-light">
                {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Guardar contraseña
              </Button>
            </form>

            <form className="space-y-4 border-t border-white/10 pt-6" onSubmit={handleEmailSubmit}>
              <h3 className="text-sm font-semibold text-gold-light">Cambiar correo electrónico</h3>

              <SettingsField
                label="Nuevo correo"
                helperText="Te enviaremos un enlace de verificación al nuevo correo."
              >
                <SettingsInput
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                />
              </SettingsField>

              <SettingsField label="Contraseña actual" helperText="Necesaria para confirmar el cambio.">
                <SettingsInput
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </SettingsField>

              {emailError ? <p className="text-sm text-red-300">{emailError}</p> : null}
              {emailMessage ? <p className="text-sm text-teal-accent">{emailMessage}</p> : null}

              <Button type="submit" disabled={emailSaving} variant="secondary" className="border-white/15 bg-white/8 text-hero-text">
                {emailSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Solicitar cambio de correo
              </Button>
            </form>
          </>
        )}
      </div>
    </SettingsSectionCard>
  )
}
