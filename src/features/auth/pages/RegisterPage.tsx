import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { TERMS_AND_CONDITIONS_URL } from '@/config/legal'
import { RegisterInviteCard } from '@/features/auth/components/RegisterInviteCard'
import { RegisterRecommendationCard } from '@/features/auth/components/RegisterRecommendationCard'
import { authInputClassName, authLabelClassName, AuthCard } from '@/features/auth/components/AuthCard'
import { AuthDivider } from '@/features/auth/components/AuthDivider'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getPostAuthRedirect } from '@/features/auth/utils/getDashboardPathByRole'
import { useInviteValidation } from '@/features/team/hooks/useInviteValidation'
import { useRecommendationValidation } from '@/features/referrals/hooks/useRecommendationValidation'
import { normalizeRecommendationCodeParam } from '@/features/referrals/utils/recommendationUtils'
import { getFirebaseAuth } from '@/lib/firebase'

type RegisterFormErrors = {
  displayName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function validateForm(values: {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}): RegisterFormErrors {
  const errors: RegisterFormErrors = {}

  if (!values.displayName.trim()) {
    errors.displayName = 'El nombre completo es obligatorio.'
  }

  if (!values.email.trim()) {
    errors.email = 'El correo es obligatorio.'
  }

  if (values.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { referralCode } = useParams<{ referralCode?: string }>()
  const [searchParams] = useSearchParams()
  const inviteCodeParam = searchParams.get('invite')?.trim() || undefined
  const recommendationCodeParam =
    normalizeRecommendationCodeParam(searchParams.get('ref')) ??
    normalizeRecommendationCodeParam(referralCode)
  const inviteValidation = useInviteValidation(inviteCodeParam)
  const recommendationValidation = useRecommendationValidation(recommendationCodeParam)
  const { currentUser, initialized, isEmailVerified, appUser, loading, registerWithEmail, registerWithGoogle } =
    useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const activeInviteCode = inviteValidation.isValid ? inviteValidation.inviteCode : undefined
  const activeRecommendationCode = recommendationValidation.isValid
    ? recommendationValidation.recommendationCode
    : undefined

  const isValidatingLinks = inviteValidation.loading || recommendationValidation.loading

  if (initialized && currentUser) {
    return <Navigate to={getPostAuthRedirect(isEmailVerified, appUser?.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationErrors = validateForm({
      displayName,
      email,
      password,
      confirmPassword,
    })

    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (isValidatingLinks) {
      return
    }

    if (recommendationValidation.hasRefParam && !inviteValidation.isValid && !recommendationValidation.isValid) {
      setError('El código de recomendación no es válido o ya no está activo.')
      return
    }

    setSubmitting(true)

    try {
      await registerWithEmail({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        referralCodeFromUrl: referralCode,
        recommendationCodeFromUrl: activeRecommendationCode,
        inviteCode: activeInviteCode,
      })
      navigate('/verificar-email', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear tu cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleRegister() {
    setError('')

    if (isValidatingLinks) {
      return
    }

    if (recommendationValidation.hasRefParam && !inviteValidation.isValid && !recommendationValidation.isValid) {
      setError('El código de recomendación no es válido o ya no está activo.')
      return
    }

    setGoogleSubmitting(true)

    try {
      const redirectPath = await registerWithGoogle({
        referralCodeFromUrl: referralCode,
        recommendationCodeFromUrl: activeRecommendationCode,
        inviteCode: activeInviteCode,
      })
      const displayName = getFirebaseAuth().currentUser?.displayName?.trim()
      showToast(
        displayName ? `¡Bienvenido/a, ${displayName}!` : '¡Bienvenido/a a EXPANSIÓN!',
        'success',
      )
      navigate(redirectPath, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear tu cuenta.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const isBusy = loading || submitting || googleSubmitting || isValidatingLinks

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-4 text-center sm:text-left">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-hero-text">Crear cuenta</h1>
            <p className="text-sm text-hero-text/70">
              {inviteValidation.isValid
                ? 'Completa tus datos para unirte al grupo.'
                : recommendationValidation.isValid
                  ? 'Completa tus datos para registrarte por recomendación.'
                  : 'Regístrate para comenzar a captar prospectos y gestionar tu crecimiento.'}
            </p>
          </div>

          <RegisterInviteCard
            loading={inviteValidation.loading}
            isValid={inviteValidation.isValid}
            hasInviteParam={inviteValidation.hasInviteParam}
            teamName={inviteValidation.team?.name}
            message={inviteValidation.message}
          />

          <RegisterRecommendationCard
            loading={recommendationValidation.loading}
            isValid={recommendationValidation.isValid}
            hasRefParam={recommendationValidation.hasRefParam}
            message={recommendationValidation.message}
          />
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Nombre completo"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={fieldErrors.displayName}
            labelClassName={authLabelClassName}
            className={authInputClassName}
          />

          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            labelClassName={authLabelClassName}
            className={authInputClassName}
          />

          <PasswordInput
            label="Contraseña"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            helperText="Mínimo 6 caracteres."
          />

          <PasswordInput
            label="Confirmar contraseña"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <p className="text-center text-xs leading-relaxed text-hero-text/65 sm:text-left">
            Al crear la cuenta aceptas nuestras{' '}
            <a
              href={TERMS_AND_CONDITIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-semibold text-teal-accent underline-offset-2 transition-colors hover:text-gold-light hover:underline"
            >
              políticas y condiciones
            </a>
            .
          </p>

          <Button
            type="submit"
            size="lg"
            className="mt-2 h-11 w-full bg-gold text-hero-bg hover:bg-gold-light"
            disabled={isBusy}
          >
            {isBusy
              ? 'Creando cuenta...'
              : inviteValidation.isValid
                ? 'Unirme al grupo'
                : recommendationValidation.isValid
                  ? 'Registrarme por recomendación'
                  : 'Crear cuenta'}
          </Button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
            {error}
          </p>
        ) : null}

        <AuthDivider />

        <GoogleAuthButton
          label={inviteValidation.isValid ? 'Unirme con Google' : 'Unirme con Google'}
          onClick={handleGoogleRegister}
          disabled={isBusy}
          loading={googleSubmitting}
        />

        <p className="mt-4 text-center text-xs leading-relaxed text-hero-text/65">
          Al unirte con Google aceptas nuestras{' '}
          <a
            href={TERMS_AND_CONDITIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer font-semibold text-teal-accent underline-offset-2 transition-colors hover:text-gold-light hover:underline"
          >
            políticas y condiciones
          </a>
          .
        </p>

        <p className="mt-8 text-center text-sm text-hero-text/70">
          ¿Ya tienes cuenta?{' '}
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
