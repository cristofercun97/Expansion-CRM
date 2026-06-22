import type { ReferralRewardLevel } from '@/features/referrals/types/referral.types'

export const EXPANSION_ANNUAL_PRICE_EUR = 160

export const REFERRAL_REWARD_LEVELS: ReferralRewardLevel[] = [
  { level: 1, label: 'Recomendación directa', amount: 30 },
  { level: 2, label: 'Segundo nivel', amount: 20 },
  { level: 3, label: 'Tercer nivel', amount: 10 },
]

export const MAX_REFERRAL_LEVELS = 3

export function formatExpansionAnnualPriceLabel(): string {
  return `${EXPANSION_ANNUAL_PRICE_EUR} € / año`
}

export function formatExpansionAnnualPriceShort(): string {
  return `${EXPANSION_ANNUAL_PRICE_EUR}€`
}
