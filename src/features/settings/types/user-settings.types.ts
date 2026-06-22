export type UserProfileGender = 'mujer' | 'hombre' | 'prefiero_no_decir' | 'otro'

export type UserProfileDetails = {
  fullName: string
  birthDate: string
  age: number
  gender: UserProfileGender | ''
  city: string
  countryCode: string
  countryName: string
  phone: string
  photoURL: string
}

export type UserBankAccountType = 'savings' | 'checking'

export type UserBankPaymentSettings = {
  accountType: UserBankAccountType
  bankName: string
  accountNumber: string
  documentId: string
}

export type UserCryptoPaymentSettings = {
  asset: 'USDT'
  network: string
  walletAddress: string
}

export type UserPaymentPreferredMethod = 'bank' | 'crypto' | ''

export type UserPaymentSettings = {
  preferredMethod: UserPaymentPreferredMethod
  bank?: UserBankPaymentSettings
  crypto?: UserCryptoPaymentSettings
}

export type UserSettingsFormState = {
  profile: UserProfileDetails
  paymentSettings: UserPaymentSettings
}
