export type InvitationOnboardingType = 'group' | 'referral'

export type InvitationOnboardingStep = 1 | 2 | 3 | 4

export type InvitationOnboardingStepMeta = {
  primaryLabel: string
  showBack: boolean
  showSkip: boolean
}

export const ONBOARDING_NARRATIVE_LABELS = [
  'DESCUBRE',
  'IMAGINA',
  'CONOCE',
  'EMPIEZA',
] as const
