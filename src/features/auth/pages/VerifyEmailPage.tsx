import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getPostAuthRedirect } from '@/features/auth/utils/getDashboardPathByRole'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const {
    appUser,
    currentUser,
    initialized,
    loading,
    isEmailVerified,
    completeEmailVerificationCheck,
    resendVerificationEmail,
    logout,
  } = useAuth()

  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-bg px-6">
        <p className="text-sm font-medium text-hero-text/70">Cargando tu sesión...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (isEmailVerified) {
    return (
      <Navigate to={getPostAuthRedirect(true, appUser?.role)} replace />
    )
  }

  async function handleConfirmVerification() {
    setChecking(true)
    setError('')
    setFeedback('')

    try {
      const redirectPath = await completeEmailVerificationCheck()

      if (redirectPath) {
        navigate(redirectPath, { replace: true })
        return
      }

      setError('Tu correo aún no está confirmado. Revisa tu bandeja y vuelve a intentar.')
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'No pudimos comprobar la verificación.',
      )
    } finally {
      setChecking(false)
    }
  }

  async function handleResendEmail() {
    setResending(true)
    setError('')
    setFeedback('')

    try {
      await resendVerificationEmail()
      setFeedback('Te reenviamos el correo de confirmación. Revisa tu bandeja de entrada.')
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'No pudimos reenviar el correo de confirmación.',
      )
    } finally {
      setResending(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const isBusy = checking || resending || loading

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-hero-text">Confirma tu correo electrónico</h1>
          <p className="text-sm leading-relaxed text-hero-text/70">
            Te enviamos un enlace de confirmación. Revisa tu bandeja de entrada y confirma tu
            cuenta para continuar.
          </p>
          {currentUser.email ? (
            <p className="text-xs text-hero-text/55">
              Correo registrado:{' '}
              <span className="font-medium text-hero-text/80">{currentUser.email}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
              {error}
            </p>
          ) : null}

          {feedback ? (
            <p className="rounded-xl border border-teal-accent/30 bg-teal-accent/10 px-4 py-3 text-sm text-hero-text backdrop-blur-sm">
              {feedback}
            </p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="h-11 w-full bg-gold text-hero-bg hover:bg-gold-light"
            disabled={isBusy}
            onClick={handleConfirmVerification}
          >
            {checking ? 'Comprobando...' : 'Ya confirmé mi correo'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full border-white/25 bg-white/10 text-hero-text hover:bg-white/15"
            disabled={isBusy}
            onClick={handleResendEmail}
          >
            {resending ? 'Reenviando...' : 'Reenviar correo'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-11 w-full text-hero-text/80 hover:bg-white/10 hover:text-hero-text"
            disabled={isBusy}
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
