const REFERRAL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateReferralCode(): string {
  let suffix = ''

  for (let index = 0; index < 6; index += 1) {
    suffix += REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)]
  }

  return `EXP-${suffix}`
}

export function generateSlug(displayName: string): string {
  const slug = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'leader'
}

export function generateSlugSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let suffix = ''

  for (let index = 0; index < 2; index += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }

  return suffix
}
