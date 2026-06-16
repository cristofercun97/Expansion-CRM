export const PRESENTATION_FIELD_LIMITS = {
  title: 70,
  subtitle: 120,
  valuePhrase: 120,
  description: 300,
  storyDescription: 600,
  testimonialText: 280,
  ctaText: 35,
  url: 300,
  formTitle: 70,
  formDescription: 180,
  interestOptionLine: 50,
  interestOptionLines: 8,
  brandName: 70,
  testimonialName: 70,
} as const

export const PRESENTATION_FIELD_HINTS = {
  brief: 'Sé breve y claro.',
  readable: 'Máximo recomendado para que la landing sea fácil de leer.',
  oneIdeaPerLine: 'Una idea por línea.',
} as const

export type PresentationFieldHintKey = keyof typeof PRESENTATION_FIELD_HINTS
