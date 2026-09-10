/**
 * PRESENTACIÓN — Encuentro gratuito (FREE-01…10)
 * Run: npx tsx scripts/test-presentation-free-session.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  defaultPresentationFormState,
  formatFreeSessionDurationLabel,
  PRESENTATION_FREE_SESSION_AVAILABILITY_COPY,
  PRESENTATION_FREE_SESSION_CTA_DEFAULT,
  PRESENTATION_FREE_SESSION_DESCRIPTION_DEFAULT,
  PRESENTATION_FREE_SESSION_TITLE_DEFAULT,
  resolveFreeSessionCtaText,
  resolveFreeSessionDescription,
  resolveFreeSessionTitle,
} from '../src/features/presentation/constants/presentationDefaults.ts'
import { PRESENTATION_EDITOR_SECTIONS } from '../src/features/presentation/constants/presentationSectionGuides.ts'
import { resolvePresentationBookingCta } from '../src/features/presentation/utils/bookingFunnelMetrics.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const editor = read('src/features/presentation/components/PresentationEditorForm.tsx')
const landing = read(
  'src/features/presentation/components/preview/PresentationPreviewLanding.tsx',
)
const guides = read('src/features/presentation/constants/presentationSectionGuides.ts')
const defaults = read('src/features/presentation/constants/presentationDefaults.ts')
const mappers = read('src/features/presentation/utils/presentationMappers.ts')

// FREE-01 — Editor no muestra “Lead magnet”
{
  assert.doesNotMatch(editor, /Lead magnet/)
  assert.doesNotMatch(guides, /Lead magnet/)
  assert.match(editor, /Encuentro gratuito de 30 minutos/)
  assert.match(guides, /Encuentro gratuito/)
  pass('FREE-01')
}

// FREE-02 — Editor no muestra URL del recurso
{
  assert.doesNotMatch(editor, /URL del recurso/)
  assert.doesNotMatch(editor, /Descargar guía/)
  assert.doesNotMatch(editor, /guía, diagnóstico o clase/i)
  pass('FREE-02')
}

// FREE-03 — Toggle usa bookingEnabled
{
  assert.match(editor, /Activar encuentro gratuito/)
  assert.match(editor, /booking:\s*\{[\s\S]*enabled/)
  assert.match(editor, /checked=\{form\.booking\.enabled\}/)
  pass('FREE-03')
}

// FREE-04 — CTA enabled → /reservar/:slug
{
  const cta = resolvePresentationBookingCta({
    bookingEnabled: true,
    landingSlug: 'tecnologiaysalud',
    resourceUrl: 'https://legacy.example/guide.pdf',
  })
  assert.equal(cta.mode, 'booking')
  assert.equal(cta.href, '/reservar/tecnologiaysalud')
  assert.equal(cta.hideCta, false)
  assert.match(editor, /\/reservar\/\{'\{slug\}'\}|\/reservar\//)
  assert.match(read('src/features/presentation/utils/bookingFunnelMetrics.ts'), /\/reservar\//)
  pass('FREE-04')
}

// FREE-05 — CTA genera presentation_booking_click existente
{
  assert.match(landing, /presentation_booking_click/)
  assert.match(landing, /trackPresentationFunnelEvent/)
  pass('FREE-05')
}

// FREE-06 — booking disabled → no enlace roto
{
  const cta = resolvePresentationBookingCta({
    bookingEnabled: false,
    landingSlug: 'tecnologiaysalud',
    resourceUrl: 'https://legacy.example/guide.pdf',
  })
  assert.equal(cta.hideCta, true)
  assert.equal(cta.mode, 'hidden')
  assert.equal(cta.href, undefined)
  assert.match(landing, /bookingCta\.hideCta/)
  pass('FREE-06')
}

// FREE-07 — duration usa bookingDurationMinutes
{
  assert.equal(formatFreeSessionDurationLabel(30), '30 minutos · Sin compromiso')
  assert.equal(formatFreeSessionDurationLabel(45), '45 minutos · Sin compromiso')
  assert.match(landing, /formatFreeSessionDurationLabel\(form\.booking\.durationMinutes\)/)
  assert.match(editor, /form\.booking\.durationMinutes/)
  pass('FREE-07')
}

// FREE-08 — preview muestra nuevo bloque
{
  assert.match(landing, /ENCUENTRO GRATUITO/)
  assert.match(landing, /encuentro-gratuito/)
  assert.match(landing, /freeSessionCta|resolveFreeSessionCtaText/)
  assert.match(defaults, /Reservar mi encuentro gratuito/)
  assert.equal(PRESENTATION_EDITOR_SECTIONS.leadMagnet.badge, 'Encuentro gratuito')
  assert.equal(PRESENTATION_FREE_SESSION_CTA_DEFAULT, 'Reservar mi encuentro gratuito')
  assert.match(PRESENTATION_FREE_SESSION_AVAILABILITY_COPY, /disponibilidad de agenda/)
  pass('FREE-08')
}

// FREE-09 — legacy data no rompe render
{
  assert.match(mappers, /resourceUrl: str\(data\.leadMagnet\?\.resourceUrl\)/)
  assert.match(mappers, /leadMagnet: form\.leadMagnet/)
  assert.match(mappers, /ctaText: resolveFreeSessionCtaText/)
  // Mapper keeps legacy resourceUrl; public CTA ignores it when booking disabled.
  const legacyCta = resolvePresentationBookingCta({
    bookingEnabled: false,
    landingSlug: 'legacy-demo',
    resourceUrl: 'https://example.com/old.pdf',
  })
  assert.equal(legacyCta.hideCta, true)
  assert.ok(defaultPresentationFormState.leadMagnet.resourceUrl === '')
  pass('FREE-09')
}

// FREE-10 — mobile sin overflow
{
  assert.match(landing, /overflow-x-hidden/)
  assert.match(landing, /max-w-full|max-w-sm|max-w-2xl/)
  pass('FREE-10')
}

// LEGACY-01 — CTA antiguo “Descargar guía”
{
  assert.equal(resolveFreeSessionCtaText('Descargar guía'), PRESENTATION_FREE_SESSION_CTA_DEFAULT)
  assert.equal(resolveFreeSessionCtaText('Descargar recurso'), PRESENTATION_FREE_SESSION_CTA_DEFAULT)
  assert.equal(resolveFreeSessionCtaText(''), PRESENTATION_FREE_SESSION_CTA_DEFAULT)
  assert.match(mappers, /resolveFreeSessionCtaText/)
  assert.match(landing, /resolveFreeSessionCtaText|freeSessionCta/)
  pass('LEGACY-01')
}

// LEGACY-02 — CTA personalizado se conserva
{
  assert.equal(resolveFreeSessionCtaText('Quiero hablar contigo'), 'Quiero hablar contigo')
  assert.equal(
    resolveFreeSessionCtaText('Agenda una llamada conmigo'),
    'Agenda una llamada conmigo',
  )
  pass('LEGACY-02')
}

// LEGACY-03 — nueva presentación → nuevos defaults
{
  assert.equal(defaultPresentationFormState.leadMagnet.ctaText, PRESENTATION_FREE_SESSION_CTA_DEFAULT)
  assert.equal(defaultPresentationFormState.leadMagnet.title, PRESENTATION_FREE_SESSION_TITLE_DEFAULT)
  assert.equal(
    defaultPresentationFormState.leadMagnet.description,
    PRESENTATION_FREE_SESSION_DESCRIPTION_DEFAULT,
  )
  pass('LEGACY-03')
}

// LEGACY-04 — title/description default incompatible → nuevo default
{
  assert.equal(resolveFreeSessionTitle('Recurso gratuito'), PRESENTATION_FREE_SESSION_TITLE_DEFAULT)
  assert.equal(resolveFreeSessionTitle('Descarga mi guía'), PRESENTATION_FREE_SESSION_TITLE_DEFAULT)
  assert.equal(
    resolveFreeSessionDescription('Obtén este recurso'),
    PRESENTATION_FREE_SESSION_DESCRIPTION_DEFAULT,
  )
  assert.equal(resolveFreeSessionTitle(''), PRESENTATION_FREE_SESSION_TITLE_DEFAULT)
  assert.match(mappers, /resolveFreeSessionTitle/)
  assert.match(mappers, /resolveFreeSessionDescription/)
  pass('LEGACY-04')
}

// LEGACY-05 — contenido personalizado antiguo NO sobrescrito
{
  assert.equal(
    resolveFreeSessionTitle('Sesión estratégica para tu equipo'),
    'Sesión estratégica para tu equipo',
  )
  assert.equal(
    resolveFreeSessionDescription('Hablemos de tu caso concreto en 30 minutos.'),
    'Hablemos de tu caso concreto en 30 minutos.',
  )
  assert.doesNotMatch(defaults, /migrate.*leadMagnet|batchUpdate.*leadMagnet/i)
  pass('LEGACY-05')
}

console.log('PRESENTACIÓN — Encuentro gratuito tests: ALL PASS')
