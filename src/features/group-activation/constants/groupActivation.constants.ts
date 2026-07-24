import { EXPANSION_ANNUAL_PRICE_EUR } from '@/features/referrals/constants/referralProgram.constants'

export const GROUP_ACTIVATION_AMOUNT = EXPANSION_ANNUAL_PRICE_EUR
export const GROUP_ACTIVATION_CURRENCY = 'EUR'

export const GROUP_ACTIVATION_PAYPAL_URL =
  'https://www.paypal.com/ncp/payment/ACDSA6XKLL5X6' as const

export const GROUP_ACTIVATION_USDT_ADDRESS =
  'TUtGttKESgmPz7nP2pH8GYitRR23YNpwZc' as const

export const GROUP_ACTIVATION_CRYPTO_CURRENCY = 'USDT' as const
export const GROUP_ACTIVATION_CRYPTO_NETWORK = 'TRON_TRC20' as const
export const GROUP_ACTIVATION_CRYPTO_NETWORK_LABEL = 'TRON — TRC20' as const

export const GROUP_ACTIVATION_PROOF_MAX_BYTES = 5 * 1024 * 1024
export const GROUP_ACTIVATION_PROOF_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'
export const GROUP_ACTIVATION_PROOF_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const
