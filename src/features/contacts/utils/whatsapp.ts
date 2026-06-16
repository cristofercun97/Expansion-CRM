export function sanitizeWhatsappNumber(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidWhatsappNumber(value: string): boolean {
  return sanitizeWhatsappNumber(value).length >= 6
}

export function getWhatsappUrl(value: string): string | null {
  const digits = sanitizeWhatsappNumber(value)

  if (digits.length < 6) {
    return null
  }

  return `https://wa.me/${digits}`
}
