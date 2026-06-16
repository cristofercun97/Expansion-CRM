export function resolveWhatsAppContactUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) {
    return null
  }

  return `https://wa.me/${digits}`
}
