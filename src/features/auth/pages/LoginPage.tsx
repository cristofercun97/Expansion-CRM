import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { authInputClassName, authLabelClassName, AuthCard } from '@/features/auth/components/AuthCard'
import { AuthDivider } from '@/features/auth/components/AuthDivider'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getPostAuthRedirect } from '@/features/auth/utils/getDashboardPathByRole'
import { getFirebaseAuth } from '@/lib/firebase'

export function LoginPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { appUser, currentUser, initialized, isEmailVerified, loading, loginWithEmail, loginWithGoogle } =
    useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  if (initialized && currentUser) {
    return <Navigate to={getPostAuthRedirect(isEmailVerified, appUser?.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const redirectPath = await loginWithEmail({ email, password })
      const displayName = getFirebaseAuth().currentUser?.displayName?.trim()
      showToast(
        displayName ? `¡Bienvenido/a, ${displayName}!` : '¡Bienvenido/a a EXPANSIÓN!',
        'success',
      )
      navigate(redirectPath, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setGoogleSubmitting(true)

    try {
      const redirectPath = await loginWithGoogle()
      const displayName = getFirebaseAuth().currentUser?.displayName?.trim()
      showToast(
        displayName ? `¡Bienvenido/a, ${displayName}!` : '¡Bienvenido/a a EXPANSIÓN!',
        'success',
      )
      navigate(redirectPath, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos iniciar sesión.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const isBusy = loading || submitting || googleSubmitting

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-hero-text">Iniciar sesión</h1>
          <p className="text-sm text-hero-text/70">Accede a tu espacio en EXPANSIÓN.</p>
        </div>

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

          <PasswordInput
            label="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <div className="-mt-2 flex justify-end">
            <Link
              to="/recuperar-contrasena"
              className="cursor-pointer text-sm font-medium text-teal-accent transition-colors hover:text-gold-light"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-11 w-full bg-gold text-hero-bg hover:bg-gold-light"
            disabled={isBusy}
          >
            {isBusy ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
            {error}
          </p>
        ) : null}

        <AuthDivider />

        <GoogleAuthButton
          label="Iniciar sesión con Google"
          onClick={handleGoogleLogin}
          disabled={isBusy}
          loading={googleSubmitting}
        />

        <p className="mt-8 text-center text-sm text-hero-text/70">
          ¿Aún no tienes cuenta?{' '}
          <Link
            to="/registro"
            className="cursor-pointer font-semibold text-teal-accent transition-colors hover:text-gold-light"
          >
            Crear cuenta
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
