/**
 * Sanitized public professional metadata for booking availability.
 * Never includes uid, email, phone, notes, meetings, or private landing fields.
 */

export type PublicBookingProfessional = {
  displayName: string
  avatarUrl: string | null
  brandName: string | null
  claim: string | null
}

function clean(value: unknown, max = 240): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, max)
}

/**
 * Build public-safe professional card fields from a validated landing document.
 */
export function buildPublicBookingProfessional(
  landing: Record<string, unknown>,
): PublicBookingProfessional {
  const visual =
    landing.visualIdentity && typeof landing.visualIdentity === 'object'
      ? (landing.visualIdentity as Record<string, unknown>)
      : {}
  const booking =
    landing.booking && typeof landing.booking === 'object'
      ? (landing.booking as Record<string, unknown>)
      : {}
  const mainMessage =
    landing.mainMessage && typeof landing.mainMessage === 'object'
      ? (landing.mainMessage as Record<string, unknown>)
      : {}

  const brandName =
    clean(visual.brandName, 120) || clean(landing.brandName, 120) || null
  const displayName = brandName || 'Profesional'
  const avatarRaw = clean(visual.photoUrl, 500)
  const avatarUrl = avatarRaw && /^https?:\/\//i.test(avatarRaw) ? avatarRaw : null
  const claim =
    clean(booking.description, 280) ||
    clean(mainMessage.subtitle, 280) ||
    clean(landing.heroSubtitle, 280) ||
    clean(mainMessage.valueTitle, 280) ||
    clean(landing.heroTitle, 280) ||
    null

  return {
    displayName,
    avatarUrl,
    brandName,
    claim,
  }
}

const FORBIDDEN_KEYS = [
  'uid',
  'ownerUid',
  'email',
  'phone',
  'whatsapp',
  'notes',
  'meetingUrl',
  'googleMeetUrl',
  'participants',
  'oauth',
  'role',
  'roles',
] as const

export function assertPublicProfessionalSafe(payload: unknown): void {
  const text = JSON.stringify(payload ?? {})
  for (const key of FORBIDDEN_KEYS) {
    if (new RegExp(`"${key}"\\s*:`, 'i').test(text)) {
      throw new Error(`Forbidden public booking field leaked: ${key}`)
    }
  }
}
