/**
 * PROFILE-01…06 — public booking owner professional metadata
 * Run: npm run test:presentation-booking-profile
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  assertPublicProfessionalSafe,
  buildPublicBookingProfessional,
  extractOwnerPublicProfileFields,
} from '../functions/src/booking/professionalMeta.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

// PROFILE-01 — owner with photoURL → correct photo
{
  const professional = buildPublicBookingProfessional(
    {
      visualIdentity: {brandName: 'Marca Norte', photoUrl: ''},
      booking: {description: 'Sesión de claridad'},
    },
    {
      displayName: 'Cristofer Cunto',
      profilePhotoURL: 'https://cdn.example.com/owner-profile.jpg',
      photoURL: 'https://cdn.example.com/owner-legacy.jpg',
    },
  )
  assert.equal(professional.avatarUrl, 'https://cdn.example.com/owner-profile.jpg')
  assert.equal(professional.displayName, 'Cristofer Cunto')
  assert.equal(professional.brandName, 'Marca Norte')
  assert.equal(professional.headline, 'Sesión de claridad')
  pass('PROFILE-01')
}

// PROFILE-02 — owner without photo → initials fallback (null avatar)
{
  const professional = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'Ana'}, booking: {description: 'Hola'}},
    {displayName: 'Ana Pérez'},
  )
  assert.equal(professional.avatarUrl, null)
  pass('PROFILE-02')
}

// PROFILE-03 — real displayName → not "Profesional"
{
  const withBrand = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'Studio CX'}},
    {displayName: 'Cristofer'},
  )
  assert.equal(withBrand.displayName, 'Cristofer')
  assert.equal(withBrand.brandName, 'Studio CX')
  assert.notEqual(withBrand.displayName, 'Profesional')

  const ownerOnly = buildPublicBookingProfessional({}, {displayName: 'Cristofer Cunto'})
  assert.equal(ownerOnly.displayName, 'Cristofer Cunto')
  assert.notEqual(ownerOnly.displayName, 'Profesional')
  pass('PROFILE-03')
}

// PROFILE-04 — another user's photo never used (only owner fields passed in)
{
  const strangerPhoto = 'https://cdn.example.com/stranger.jpg'
  const professional = buildPublicBookingProfessional(
    {
      visualIdentity: {
        brandName: 'Owner Brand',
        // logo must never win over person photo absence
        logoUrl: strangerPhoto,
      },
    },
    {displayName: 'Owner', photoURL: 'https://cdn.example.com/owner.jpg'},
  )
  assert.equal(professional.avatarUrl, 'https://cdn.example.com/owner.jpg')
  assert.notEqual(professional.avatarUrl, strangerPhoto)

  const handlers = read('functions/src/booking/handlers.ts')
  assert.ok(handlers.includes('extractOwnerPublicProfileFields'))
  assert.ok(handlers.includes('COLLECTIONS.users).doc(ownerUid)'))
  pass('PROFILE-04')
}

// PROFILE-05 — public response without PII
{
  const owner = extractOwnerPublicProfileFields({
    displayName: 'Cristofer',
    email: 'secret@example.com',
    phone: '+34000000000',
    photoURL: 'https://cdn.example.com/a.jpg',
    profile: {fullName: 'Cristofer Cunto', photoURL: 'https://cdn.example.com/p.jpg'},
    roles: ['admin'],
  })
  assert.equal(owner.displayName, 'Cristofer')
  assert.equal(owner.fullName, 'Cristofer Cunto')
  assert.equal(owner.profilePhotoURL, 'https://cdn.example.com/p.jpg')
  assert.ok(!('email' in owner))
  assert.ok(!('phone' in owner))
  assert.ok(!('roles' in owner))

  const professional = buildPublicBookingProfessional(
    {
      visualIdentity: {brandName: 'CX'},
      email: 'leak@test.com',
      ownerUid: 'uid_secret',
      phone: '+34999',
    },
    owner,
  )
  assert.equal(professional.displayName, 'Cristofer')
  assert.equal(professional.brandName, 'CX')
  const payload = {professional, dates: {}}
  assertPublicProfessionalSafe(payload)
  const text = JSON.stringify(payload)
  assert.ok(!text.includes('secret@example.com'))
  assert.ok(!text.includes('leak@test.com'))
  assert.ok(!/"uid"\s*:/.test(text))
  assert.ok(!/"email"\s*:/.test(text))
  assert.ok(!/"phone"\s*:/.test(text))
  assert.ok(!/"roles"\s*:/.test(text))
  assert.ok(!/"ownerUid"\s*:/.test(text))
  pass('PROFILE-05')
}

// PROFILE-06 — frontend uses response.professional without extra public fetch
{
  const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
  const service = read('src/features/presentation/services/publicBooking.service.ts')
  assert.ok(service.includes('professional: PublicBookingProfessional'))
  assert.ok(page.includes('availability.professional'))
  assert.ok(page.includes('professional?.avatarUrl'))
  assert.ok(page.includes('professional?.headline') || page.includes('professional?.claim'))
  assert.ok(!page.includes('presentationService'))
  assert.ok(!page.includes('getPublishedPresentationBySlug'))
  assert.ok(!page.includes('getDoc('))
  assert.ok(!page.includes('collection(db'))
  pass('PROFILE-06')
}

// Landing personal photo used when owner has none; logo never used
{
  const fromLanding = buildPublicBookingProfessional({
    visualIdentity: {
      brandName: 'B',
      photoUrl: 'https://cdn.example.com/landing-person.jpg',
      logoUrl: 'https://cdn.example.com/logo.png',
    },
  })
  assert.equal(fromLanding.avatarUrl, 'https://cdn.example.com/landing-person.jpg')
  pass('PROFILE-EXTRA-landing-photo-not-logo')
}

// PROFILE-NAME-01 — owner name + brandName → person vs brand
{
  const professional = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'XTRA TEAM'}},
    {displayName: 'Cristofer Cunto'},
  )
  assert.equal(professional.displayName, 'Cristofer Cunto')
  assert.equal(professional.brandName, 'XTRA TEAM')
  pass('PROFILE-NAME-01')
}

// PROFILE-NAME-02 — sin brandName → nombre persona correcto
{
  const professional = buildPublicBookingProfessional(
    {visualIdentity: {}},
    {displayName: 'Cristofer Cunto'},
  )
  assert.equal(professional.displayName, 'Cristofer Cunto')
  assert.equal(professional.brandName, null)
  pass('PROFILE-NAME-02')
}

// PROFILE-NAME-03 — sin nombre persona → “Profesional”
{
  const professional = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'XTRA TEAM'}},
  )
  assert.equal(professional.displayName, 'Profesional')
  assert.equal(professional.brandName, 'XTRA TEAM')
  pass('PROFILE-NAME-03')
}

// PROFILE-NAME-04 — brandName nunca sustituye al nombre personal si este existe
{
  const professional = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'XTRA TEAM'}},
    {displayName: 'Cristofer Cunto', fullName: 'Otro'},
  )
  assert.equal(professional.displayName, 'Cristofer Cunto')
  assert.notEqual(professional.displayName, professional.brandName)
  assert.equal(professional.brandName, 'XTRA TEAM')

  const fullNameOnly = buildPublicBookingProfessional(
    {visualIdentity: {brandName: 'Marca'}},
    {fullName: 'Ana Pérez'},
  )
  assert.equal(fullNameOnly.displayName, 'Ana Pérez')
  assert.equal(fullNameOnly.brandName, 'Marca')
  pass('PROFILE-NAME-04')
}

console.log('PRESENTACIÓN ↔ AGENDA — booking owner profile tests: ALL PASS')
