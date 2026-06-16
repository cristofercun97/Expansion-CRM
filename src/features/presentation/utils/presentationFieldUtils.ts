import {
  PRESENTATION_FIELD_HINTS,
  PRESENTATION_FIELD_LIMITS,
  type PresentationFieldHintKey,
} from '@/features/presentation/constants/presentationFieldLimits'

export function clampPresentationText(value: string, maxLength: number): string {
  return value.slice(0, maxLength)
}

export function normalizeInterestOptionsText(value: string): string {
  const lines = value
    .split('\n')
    .map((line) => clampPresentationText(line.trim(), PRESENTATION_FIELD_LIMITS.interestOptionLine))
    .filter(Boolean)

  return lines.slice(0, PRESENTATION_FIELD_LIMITS.interestOptionLines).join('\n')
}

export function countInterestOptionLines(value: string): number {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean).length
}

export function buildPresentationHelperText(
  helperText?: string,
  hint?: PresentationFieldHintKey,
): string | undefined {
  const parts: string[] = []

  if (hint) {
    parts.push(PRESENTATION_FIELD_HINTS[hint])
  }

  if (helperText?.trim()) {
    parts.push(helperText.trim())
  }

  return parts.length > 0 ? parts.join(' ') : undefined
}

export { PRESENTATION_FIELD_LIMITS }
