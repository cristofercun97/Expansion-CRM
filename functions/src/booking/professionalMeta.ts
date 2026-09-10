/**
 * Sanitized public professional metadata for booking availability.
 * Never includes uid, email, phone, notes, meetings, or private landing fields.
 */

export type PublicBookingProfessional = {
  displayName: string
  avatarUrl: string | null
  brandName: string | null
  headline: string | null
  /** @deprecated Prefer headline — kept for older clients */
  claim: string | null
}

export type OwnerPublicProfileFields = {
  /** users/{uid}.displayName */
  displayName?: string
  /** users/{uid}.profile.fullName or equivalent */
  fullName?: string
  photoURL?: string
  profilePhotoURL?: string
}

function clean(value: unknown, max = 240): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, max)
}

function httpsUrl(value: string): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null
}

/**
 * Optional personal public name stored on the Marca Personal landing.
 * Does not invent fields — only reads known optional keys if present.
 * Never uses brandName (that is the brand, not the person).
 */
function landingPersonalPublicName(landing: Record<string, unknown>): string {
  const visual =
    landing.visualIdentity && typeof landing.visualIdentity === 'object'
      ? (landing.visualIdentity as Record<string, unknown>)
      : {}
  return (
    clean(landing.ownerPublicName, 120) ||
    clean(landing.publicName, 120) ||
    clean(visual.ownerPublicName, 120) ||
    clean(visual.publicName, 120) ||
    ''
  )
}

/**
 * Build public-safe professional card fields from a validated landing document
 * plus optional owner profile fields (users/{uid}).
 *
 * Avatar priority:
 * 1. Owner profile.photoURL (configured personal photo)
 * 2. Owner photoURL / avatarUrl
 * 3. Marca Personal visualIdentity.photoUrl (personal photo, never logoUrl)
 *
 * Display name (PERSON) priority:
 * 1. Personal public name on Marca Personal landing (if present)
 * 2. users/{ownerUid}.displayName
 * 3. users/{ownerUid}.fullName / profile.fullName
 * 4. "Profesional"
 *
 * brandName is ALWAYS the configured brand — never used as displayName.
 */
export function buildPublicBookingProfessional(
  landing: Record<string, unknown>,
  owner?: OwnerPublicProfileFields | null,
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

  const displayName =
    landingPersonalPublicName(landing) ||
    clean(owner?.displayName, 120) ||
    clean(owner?.fullName, 120) ||
    'Profesional'

  const ownerConfiguredPhoto = httpsUrl(clean(owner?.profilePhotoURL, 500))
  const ownerAvatar = httpsUrl(clean(owner?.photoURL, 500))
  const landingPersonalPhoto = httpsUrl(clean(visual.photoUrl, 500))
  // Never use visual.logoUrl (enterprise logo) for the person card.
  const avatarUrl = ownerConfiguredPhoto || ownerAvatar || landingPersonalPhoto || null

  const headline =
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
    headline,
    claim: headline,
  }
}

/**
 * Extract public-safe name/photo fields from a users/{uid} document.
 * Does not return email, phone, roles, or other PII.
 */
export function extractOwnerPublicProfileFields(
  userData: Record<string, unknown> | null | undefined,
): OwnerPublicProfileFields {
  if (!userData) return {}
  const profile =
    userData.profile && typeof userData.profile === 'object'
      ? (userData.profile as Record<string, unknown>)
      : {}

  const displayName = clean(userData.displayName, 120)
  const fullName =
    clean(profile.fullName, 120) || clean(userData.fullName, 120) || ''
  const profilePhotoURL = clean(profile.photoURL, 500)
  const photoURL =
    clean(userData.photoURL, 500) || clean(userData.avatarUrl, 500) || ''

  return {
    ...(displayName ? {displayName} : {}),
    ...(fullName ? {fullName} : {}),
    ...(photoURL ? {photoURL} : {}),
    ...(profilePhotoURL ? {profilePhotoURL} : {}),
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
