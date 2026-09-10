/**
 * PRESENTACIÓN ↔ AGENDA — FASE 3 conversion tests (CONV / METRIC / SEC / CTA).
 * Pure logic + source contracts (no live network).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertNoPiiInFunnelPayload,
  bookingClickToBookingRate,
  emptyBookingFunnelMetrics,
  formatBookingConversionRate,
  funnelCounterField,
  mapBookingFunnelMetrics,
} from '../functions/src/booking/conversion.ts'
import { buildNotificationDedupeKey } from '../functions/src/meetings/reminderLogic.ts'
import {
  formatBookingConversionRate as formatClientRate,
  resolvePresentationBookingCta,
} from '../src/features/presentation/utils/bookingFunnelMetrics.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

// CONV-01 — booking creates organizer notification type
{
  const handlers = read('functions/src/booking/handlers.ts')
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /public_booking_created/)
  assert.match(conversion, /Nueva reserva desde tu presentación/)
  assert.match(handlers, /ensurePublicBookingConversionEffects/)
  pass('CONV-01')
}

// CONV-02 — notification idempotent via dedupe key
{
  const a = buildNotificationDedupeKey(['public_booking_created', 'b1', 'u1'])
  const b = buildNotificationDedupeKey(['public_booking_created', 'b1', 'u1'])
  const c = buildNotificationDedupeKey(['public_booking_created', 'b2', 'u1'])
  assert.equal(a, b)
  assert.notEqual(a, c)
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /createNotificationOnce/)
  assert.match(conversion, /code === 6/)
  pass('CONV-02')
}

// CONV-03 — booking_created activity once (fixed doc id)
{
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /pb_booking_created_\$\{bookingId\}/)
  assert.match(conversion, /eventKind: "booking_created"/)
  assert.match(conversion, /pb_meeting_scheduled_\$\{bookingId\}/)
  pass('CONV-03')
}

// CONV-04 — contact metadata without overwriting source when present
{
  const handlers = read('functions/src/booking/handlers.ts')
  assert.match(handlers, /source: current\.source \|\| "presentation_booking"/)
  assert.match(handlers, /lastInteractionAt/)
  const conversion = read('functions/src/booking/conversion.ts')
  assert.doesNotMatch(conversion, /status:\s*"converted"/)
  assert.doesNotMatch(conversion, /status:\s*"interested"/)
  pass('CONV-04')
}

// CONV-05 — booking_completed analytics without PII
{
  assert.throws(() => assertNoPiiInFunnelPayload({ email: 'a@b.c' }))
  assert.throws(() => assertNoPiiInFunnelPayload({ name: 'Ada' }))
  assert.doesNotThrow(() =>
    assertNoPiiInFunnelPayload({ presentationSlug: 'demo', bookingDuration: 30 }),
  )
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /booking_completed_\$\{bookingId\}/)
  assert.doesNotMatch(conversion, /email: input/)
  pass('CONV-05')
}

// CONV-06 — refresh/retry does not duplicate completed event
{
  const handlers = read('functions/src/booking/handlers.ts')
  assert.match(handlers, /if \(existingIdem\.exists\)/)
  assert.match(handlers, /ensurePublicBookingConversionEffects/)
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /if \(analyticsSnap\.exists\)/)
  pass('CONV-06')
}

// METRIC-01/02/03/04
{
  const empty = emptyBookingFunnelMetrics()
  assert.equal(formatBookingConversionRate(empty), '—')
  assert.equal(bookingClickToBookingRate(empty), null)
  pass('METRIC-04')

  const mapped = mapBookingFunnelMetrics({ views: 10, bookingClicks: 4, bookings: 1 })
  assert.equal(mapped.views, 10)
  assert.equal(mapped.bookingClicks, 4)
  assert.equal(mapped.bookings, 1)
  pass('METRIC-01')
  pass('METRIC-02')

  assert.equal(formatBookingConversionRate(mapped), '25%')
  assert.equal(formatClientRate(mapped), '25%')
  pass('METRIC-03')

  assert.equal(funnelCounterField('presentation_view'), 'views')
  assert.equal(funnelCounterField('presentation_booking_click'), 'bookingClicks')
  assert.equal(funnelCounterField('booking_completed'), 'bookings')
  assert.equal(funnelCounterField('booking_started'), null)

  // Nested metrics must use update() — set({merge}) with dotted keys creates literal field names.
  const conversion = read('functions/src/booking/conversion.ts')
  assert.match(conversion, /\.update\(\{[\s\S]*bookingFunnel\.\$\{counterField\}/)
  assert.match(conversion, /tx\.update\(landingRef/)
  assert.doesNotMatch(
    conversion,
    /\.set\(\s*\{[\s\S]*bookingFunnel\.\$\{counterField\}[\s\S]*\}\s*,\s*\{merge:\s*true\}/,
  )
  pass('METRIC-05')
}

// SEC-01 — owner metrics from own landing page mapping
{
  const page = read('src/features/presentation/pages/PresentationPage.tsx')
  const editor = read('src/features/presentation/components/PresentationEditorForm.tsx')
  assert.match(page, /bookingFunnel/)
  assert.match(editor, /presentation-booking-metrics/)
  assert.match(page, /record\.bookingFunnel/)
  pass('SEC-01')
}

// SEC-02 — foreign funnel events denied to clients
{
  const rules = read('firestore.rules')
  assert.match(rules, /match \/presentationFunnelEvents\/\{eventId\}/)
  assert.match(rules, /allow read, write: if false/)
  pass('SEC-02')
}

// CTA-01 / CTA-02
{
  const enabled = resolvePresentationBookingCta({
    bookingEnabled: true,
    landingSlug: 'demo-leader',
    resourceUrl: 'https://example.com/guide',
  })
  assert.equal(enabled.mode, 'booking')
  assert.equal(enabled.href, '/reservar/demo-leader')
  assert.equal(enabled.hideCta, false)
  pass('CTA-01')

  const disabledResource = resolvePresentationBookingCta({
    bookingEnabled: false,
    landingSlug: 'demo-leader',
    resourceUrl: 'https://example.com/guide',
  })
  assert.equal(disabledResource.mode, 'hidden')
  assert.equal(disabledResource.hideCta, true)
  assert.equal(disabledResource.href, undefined)

  const disabledForm = resolvePresentationBookingCta({
    bookingEnabled: false,
    landingSlug: 'demo-leader',
    resourceUrl: '',
  })
  assert.equal(disabledForm.mode, 'hidden')
  assert.equal(disabledForm.hideCta, true)
  pass('CTA-02')
}

// Success + disabled route contracts
{
  const success = read('src/features/presentation/components/booking/PublicBookingSuccess.tsx')
  assert.match(success, /Cita confirmada/)
  assert.match(success, /Tu encuentro está reservado/)
  assert.match(success, /Finalizar/)
  assert.match(success, /Volver a la presentación/)

  const bookingPage = read('src/features/presentation/pages/PublicBookingPage.tsx')
  assert.match(bookingPage, /Las reservas no están disponibles en este momento/)
  assert.match(bookingPage, /booking_started/)

  const landing = read(
    'src/features/presentation/components/preview/PresentationPreviewLanding.tsx',
  )
  assert.match(landing, /presentation_view/)
  assert.match(landing, /presentation_booking_click/)

  const index = read('functions/src/index.ts')
  assert.match(index, /trackPresentationFunnelEvent/)
}

console.log('Presentation booking Fase 3 conversion tests OK')
