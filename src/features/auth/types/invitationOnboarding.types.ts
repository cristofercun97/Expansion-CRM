export type InvitationOnboardingType = 'group' | 'referral'

export type InvitationOnboardingStep = 1 | 2 | 3

export type InvitationOnboardingBenefit = {
  emoji: string
  title: string
  description?: string
}

export type InvitationOnboardingStepContent = {
  title: string
  paragraphs?: string[]
  benefits?: InvitationOnboardingBenefit[]
  closingParagraphs?: string[]
  primaryLabel: string
  showBack?: boolean
  showSkip?: boolean
}
