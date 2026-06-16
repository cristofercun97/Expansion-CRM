import { doc, getDoc } from 'firebase/firestore'
import { referralCodesService } from '@/services/referral-codes.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import { generateReferralCode, generateSlug, generateSlugSuffix } from './generators'

const MAX_REFERRAL_ATTEMPTS = 12
const MAX_SLUG_ATTEMPTS = 20

// referralCodes tiene lectura pública intencional en firestore.rules (code, leaderId, isActive).
// No almacenar datos sensibles en ese documento.
export async function ensureUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_REFERRAL_ATTEMPTS; attempt += 1) {
    const code = generateReferralCode()
    const existing = await referralCodesService.getReferralCode(code)

    if (!existing) {
      return code
    }
  }

  throw new Error('No se pudo generar un código de referido único. Intenta nuevamente.')
}

// slugs/{slug} tiene lectura pública intencional: solo comprueba disponibilidad (slug, uid, isActive).
// No almacenar datos sensibles en ese documento.
async function isSlugReserved(candidateSlug: string): Promise<boolean> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.slugs, candidateSlug))
  return snapshot.exists()
}

// SECURITY:
// ensureUniqueSlug() consulta slugs/{slug} y debe reservarse en el batch de registro post-Auth.
// No consultar leaders para disponibilidad: production rules bloquean lectura cruzada en leaders.
export async function ensureUniqueSlug(displayName: string): Promise<string> {
  const baseSlug = generateSlug(displayName)

  if (!(await isSlugReserved(baseSlug))) {
    return baseSlug
  }

  for (let attempt = 2; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidateSlug =
      attempt <= 6 ? `${baseSlug}-${attempt}` : `${baseSlug}-${generateSlugSuffix()}`

    if (!(await isSlugReserved(candidateSlug))) {
      return candidateSlug
    }
  }

  throw new Error('No se pudo generar un enlace único para tu perfil. Intenta nuevamente.')
}

export { generateReferralCode, generateSlug } from './generators'
