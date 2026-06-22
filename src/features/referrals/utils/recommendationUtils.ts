export function buildRecommendationUrl(recommendationCode: string): string {
  const encodedCode = encodeURIComponent(recommendationCode.trim())

  if (typeof window === 'undefined') {
    return `/registro?ref=${encodedCode}`
  }

  return `${window.location.origin}/registro?ref=${encodedCode}`
}

export function buildRecommendationMessage(recommendationCode: string): string {
  const recommendationUrl = buildRecommendationUrl(recommendationCode)

  return `Hola 👋 Quiero recomendarte Expansión, una plataforma para organizar equipos, contactos, formación y crecimiento comercial.

Puedes registrarte aquí:
${recommendationUrl}`
}

export function normalizeRecommendationCodeParam(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()

  if (!trimmed) {
    return undefined
  }

  return trimmed.toUpperCase()
}
