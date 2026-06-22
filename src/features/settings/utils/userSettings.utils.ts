import type { AppUser } from '@/types'
import type {
  UserPaymentSettings,
  UserProfileDetails,
  UserSettingsFormState,
} from '@/features/settings/types/user-settings.types'

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export const GENDER_OPTIONS = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decirlo' },
  { value: 'otro', label: 'Otro' },
] as const

export const CRYPTO_NETWORK_OPTIONS = ['TRC20', 'ERC20', 'BEP20', 'Polygon', 'Otra'] as const

export function calculateAgeFromBirthDate(birthDate: string): number | null {
  const trimmed = birthDate.trim()

  if (!trimmed) {
    return null
  }

  const date = new Date(`${trimmed}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }

  if (age < 0 || age > 120) {
    return null
  }

  return age
}

export function createEmptyProfile(appUser?: AppUser | null): UserProfileDetails {
  return {
    fullName: appUser?.profile?.fullName?.trim() || appUser?.displayName?.trim() || '',
    birthDate: appUser?.profile?.birthDate ?? '',
    age: appUser?.profile?.age ?? 0,
    gender: appUser?.profile?.gender ?? '',
    city: appUser?.profile?.city ?? '',
    countryCode: appUser?.profile?.countryCode ?? '',
    countryName: appUser?.profile?.countryName ?? '',
    phone: appUser?.profile?.phone?.trim() || appUser?.phone?.trim() || '',
    photoURL: appUser?.profile?.photoURL?.trim() || appUser?.photoURL?.trim() || '',
  }
}

export function createEmptyPaymentSettings(appUser?: AppUser | null): UserPaymentSettings {
  return {
    preferredMethod: appUser?.paymentSettings?.preferredMethod ?? '',
    bank: appUser?.paymentSettings?.bank
      ? { ...appUser.paymentSettings.bank }
      : {
          accountType: 'savings',
          bankName: '',
          accountNumber: '',
          documentId: '',
        },
    crypto: appUser?.paymentSettings?.crypto
      ? { ...appUser.paymentSettings.crypto }
      : {
          asset: 'USDT',
          network: 'TRC20',
          walletAddress: '',
        },
  }
}

export function createUserSettingsFormState(appUser?: AppUser | null): UserSettingsFormState {
  const profile = createEmptyProfile(appUser)

  if (profile.birthDate && !profile.age) {
    profile.age = calculateAgeFromBirthDate(profile.birthDate) ?? 0
  }

  return {
    profile,
    paymentSettings: createEmptyPaymentSettings(appUser),
  }
}

export function mapFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/requires-recent-login':
      return 'Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.'
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.'
    case 'auth/email-already-in-use':
      return 'Ese correo ya está registrado en otra cuenta.'
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'La contraseña actual no es correcta.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    case 'auth/operation-not-allowed':
      return 'Esta operación no está disponible para tu tipo de cuenta.'
    default:
      return 'No pudimos completar la operación. Inténtalo de nuevo.'
  }
}

export function validateProfileForm(profile: UserProfileDetails): Record<string, string> {
  const errors: Record<string, string> = {}

  if (profile.fullName.trim().length < 2) {
    errors.fullName = 'Introduce tu nombre y apellidos.'
  }

  if (profile.birthDate) {
    const age = calculateAgeFromBirthDate(profile.birthDate)

    if (age === null) {
      errors.birthDate = 'Introduce una fecha de nacimiento válida.'
    }
  }

  if (profile.phone.trim() && profile.phone.trim().length < 6) {
    errors.phone = 'Introduce un número de contacto válido.'
  }

  return errors
}

export function validatePaymentSettingsForm(
  paymentSettings: UserPaymentSettings,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!paymentSettings.preferredMethod) {
    return errors
  }

  if (paymentSettings.preferredMethod === 'bank') {
    const bank = paymentSettings.bank

    if (!bank?.bankName.trim()) {
      errors.bankName = 'Indica el nombre del banco.'
    }

    if (!bank?.accountNumber.trim() || bank.accountNumber.trim().length < 4) {
      errors.accountNumber = 'Indica un número de cuenta válido.'
    }

    if (!bank?.documentId.trim()) {
      errors.documentId = 'Indica tu documento de identidad.'
    }
  }

  if (paymentSettings.preferredMethod === 'crypto') {
    const crypto = paymentSettings.crypto

    if (!crypto?.network.trim()) {
      errors.network = 'Selecciona una red.'
    }

    if (!crypto?.walletAddress.trim() || crypto.walletAddress.trim().length < 8) {
      errors.walletAddress = 'Indica una wallet válida.'
    }
  }

  return errors
}
