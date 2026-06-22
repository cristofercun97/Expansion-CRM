import { updateProfile, type User } from 'firebase/auth'
import { usersService } from '@/services/users.service'
import type {
  UserPaymentSettings,
  UserProfileDetails,
} from '@/features/settings/types/user-settings.types'
import { calculateAgeFromBirthDate } from '@/features/settings/utils/userSettings.utils'

export type SaveUserSettingsInput = {
  profile: UserProfileDetails
  paymentSettings: UserPaymentSettings
}

function buildProfilePayload(profile: UserProfileDetails): UserProfileDetails {
  const birthDate = profile.birthDate.trim()
  const calculatedAge = birthDate ? calculateAgeFromBirthDate(birthDate) : null

  return {
    fullName: profile.fullName.trim(),
    birthDate,
    age: calculatedAge ?? 0,
    gender: profile.gender,
    city: profile.city.trim(),
    countryCode: profile.countryCode.trim().toUpperCase(),
    countryName: profile.countryName.trim(),
    phone: profile.phone.trim(),
    photoURL: profile.photoURL.trim(),
  }
}

function buildPaymentSettingsPayload(
  paymentSettings: UserPaymentSettings,
): UserPaymentSettings | null {
  if (!paymentSettings.preferredMethod) {
    return {
      preferredMethod: '',
    }
  }

  if (paymentSettings.preferredMethod === 'bank') {
    return {
      preferredMethod: 'bank',
      bank: {
        accountType: paymentSettings.bank?.accountType === 'checking' ? 'checking' : 'savings',
        bankName: paymentSettings.bank?.bankName.trim() ?? '',
        accountNumber: paymentSettings.bank?.accountNumber.trim() ?? '',
        documentId: paymentSettings.bank?.documentId.trim() ?? '',
      },
    }
  }

  return {
    preferredMethod: 'crypto',
    crypto: {
      asset: 'USDT',
      network: paymentSettings.crypto?.network.trim() ?? '',
      walletAddress: paymentSettings.crypto?.walletAddress.trim() ?? '',
    },
  }
}

export async function saveUserSettings(
  uid: string,
  authUser: User | null,
  input: SaveUserSettingsInput,
): Promise<void> {
  const profile = buildProfilePayload(input.profile)
  const paymentSettings = buildPaymentSettingsPayload(input.paymentSettings)

  await usersService.updateUserProfile(uid, {
    displayName: profile.fullName,
    phone: profile.phone,
    photoURL: profile.photoURL || undefined,
    profile,
    paymentSettings: paymentSettings ?? undefined,
  })

  if (authUser) {
    await updateProfile(authUser, {
      displayName: profile.fullName,
      photoURL: profile.photoURL || null,
    })
  }
}
