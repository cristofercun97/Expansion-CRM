import type {
  InvitationOnboardingStep,
  InvitationOnboardingStepMeta,
  InvitationOnboardingType,
} from '@/features/auth/types/invitationOnboarding.types'

type BuildMetaInput = {
  type: InvitationOnboardingType
  teamName?: string
}

export function getInvitationOnboardingPrimaryLabel(
  type: InvitationOnboardingType,
  step: InvitationOnboardingStep,
): string {
  if (step === 1) {
    return 'Quiero verlo →'
  }

  if (step === 2) {
    return '¿Cómo funciona? →'
  }

  if (step === 3) {
    return 'Quiero empezar →'
  }

  return type === 'group' ? 'Unirme al grupo →' : 'Crear mi cuenta →'
}

export function getInvitationOnboardingStepMeta(
  input: BuildMetaInput,
  step: InvitationOnboardingStep,
): InvitationOnboardingStepMeta {
  return {
    primaryLabel: getInvitationOnboardingPrimaryLabel(input.type, step),
    showBack: step > 1,
    showSkip: step === 4,
  }
}

export function getInvitationOnboardingEyebrow(
  type: InvitationOnboardingType,
  teamName?: string,
): string | null {
  if (type !== 'group') {
    return null
  }

  const normalizedName = teamName?.trim()

  if (normalizedName) {
    return `Te han invitado a formar parte de ${normalizedName}`
  }

  return 'Te han invitado a formar parte de un grupo en Expansión'
}
