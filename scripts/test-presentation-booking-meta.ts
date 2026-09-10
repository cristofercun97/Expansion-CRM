/**
 * PRESENTACIÓN ↔ AGENDA — booking professional metadata (META-01…04)
 * Run: npm run test:presentation-booking-meta
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertPublicProfessionalSafe,
  buildPublicBookingProfessional,
} from '../functions/src/booking/professionalMeta.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

// META-01 — response builder contains allowed public metadata
{
  const professional = buildPublicBookingProfessional({
    visualIdentity: {
      brandName: 'Estudio Norte',
      photoUrl: 'https://cdn.example.com/a.jpg',
    },
    booking: {
      enabled: true,
      description: 'Sesión de claridad',
    },
    mainMessage: { subtitle: 'ignored when booking.description exists' },
    email: 'secret@example.com',
    ownerUid: 'uid_secret',
  })

  assert.equal(professional.displayName, 'Estudio Norte')
  assert.equal(professional.avatarUrl, 'https://cdn.example.com/a.jpg')
  assert.equal(professional.brandName, 'Estudio Norte')
  assert.equal(professional.claim, 'Sesión de claridad')
  assertPublicProfessionalSafe({ professional })

  const handlers = read('functions/src/booking/handlers.ts')
  assert.ok(handlers.includes('professional: presentation.professional'))
  assert.ok(handlers.includes('buildPublicBookingProfessional'))
  pass('META-01')
}

// META-02 — sanitization: no private fields in public professional payload
{
  const professional = buildPublicBookingProfessional({
    visualIdentity: { brandName: 'Ana', photoUrl: 'https://cdn.example.com/p.png' },
    booking: { description: 'Claim público' },
    email: 'ana@private.test',
    phone: '+34000000000',
    notes: 'privado',
    meetingUrl: 'https://meet.google.com/x',
    ownerUid: 'abc',
  })
  const payload = {
    professional,
    timezone: 'Europe/Madrid',
    durationMinutes: 30,
    dates: { '2026-09-18': ['09:00'] },
  }
  assertPublicProfessionalSafe(payload)
  const text = JSON.stringify(payload)
  assert.ok(!text.includes('ana@private.test'))
  assert.ok(!/"uid"\s*:/.test(text))
  assert.ok(!/"email"\s*:/.test(text))
  assert.ok(!/"phone"\s*:/.test(text))
  assert.ok(!/"notes"\s*:/.test(text))
  assert.ok(!/"meetingUrl"\s*:/.test(text))
  assert.ok(!/"ownerUid"\s*:/.test(text))
  pass('META-02')
}

// META-03 — invalid/inactive slug path does not leak metadata (contract)
{
  const handlers = read('functions/src/booking/handlers.ts')
  // resolve throws not-found before returning professional
  assert.ok(handlers.includes('Presentación no encontrada.'))
  assert.ok(handlers.includes('Las reservas no están habilitadas.'))
  assert.ok(handlers.includes('isPublished !== true'))
  // professional is only returned after resolvePublishedPresentation succeeds
  const idxResolve = handlers.indexOf('const presentation = await resolvePublishedPresentation')
  const idxReturn = handlers.indexOf('professional: presentation.professional')
  assert.ok(idxResolve > 0 && idxReturn > idxResolve)
  pass('META-03')
}

// META-04 — frontend uses availability.professional; no public presentation fetch
{
  const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
  const service = read('src/features/presentation/services/publicBooking.service.ts')
  assert.ok(service.includes('professional: PublicBookingProfessional'))
  assert.ok(page.includes('availability.professional'))
  assert.ok(!page.includes('presentationService'))
  assert.ok(!page.includes('getPublishedPresentationBySlug'))
  assert.ok(!page.includes('mapRecordToForm'))
  pass('META-04')
}

// Fallbacks
{
  const empty = buildPublicBookingProfessional({})
  assert.equal(empty.displayName, 'Profesional')
  assert.equal(empty.avatarUrl, null)
  assert.equal(empty.claim, null)
  const badAvatar = buildPublicBookingProfessional({
    visualIdentity: { brandName: 'X', photoUrl: 'not-a-url' },
  })
  assert.equal(badAvatar.avatarUrl, null)
  pass('META-EXTRA-fallbacks')
}

console.log('PRESENTACIÓN ↔ AGENDA — booking metadata tests: ALL PASS')
