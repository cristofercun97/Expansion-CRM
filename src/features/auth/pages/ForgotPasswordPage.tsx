import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { authInputClassName, authLabelClassName, AuthCard } from '@/features/auth/components/AuthCard'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth.service'
import { translateAuthError } from '@/features/auth/utils/auth-errors'
import { getPostAuthRedirect } from '@/features/auth/utils/getDashboardPathByRole'

export function ForgotPasswordPage() {
  const { appUser, currentUser, initialized, isEmailVerified } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (initialized && currentUser) {
    return <Navigate to={getPostAuthRedirect(isEmailVerified, appUser?.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)

    try {
      await authService.sendPasswordResetEmail(email)
      setSuccess(true)
    } catch (submitError) {
      setError(translateAuthError(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-hero-text">Recuperar contraseña</h1>
          <p className="text-sm text-hero-text/70">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {success ? (
          <div className="mt-6 space-y-5">
            <p className="rounded-xl border border-teal-accent/30 bg-teal-accent/10 px-4 py-3 text-sm text-hero-text backdrop-blur-sm">
              Revisa tu bandeja de entrada. Si existe una cuenta con ese correo, recibirás un
              enlace para restablecer tu contraseña.
            </p>

            <Link
              to="/login"
              className="inline-flex cursor-pointer text-sm font-semibold text-teal-accent transition-colors hover:text-gold-light"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              labelClassName={authLabelClassName}
              className={authInputClassName}
              required
            />

            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-2 h-11 w-full bg-gold text-hero-bg hover:bg-gold-light"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-hero-text/70">
          ¿Recordaste tu contraseña?{' '}
          <Link
            to="/login"
            className="cursor-pointer font-semibold text-teal-accent transition-colors hover:text-gold-light"
          >
            Iniciar sesión
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
