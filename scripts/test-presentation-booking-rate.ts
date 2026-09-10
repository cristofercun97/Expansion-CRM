/**
 * RATE-01…06 — public booking availability rate limit + request coalescing
 * Run: npm run test:presentation-booking-rate
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  AVAILABILITY_RATE_LIMIT,
  CREATE_RATE_LIMIT,
  isRateLimitExceeded,
  nextRateLimitWindowMs,
  normalBookingFlowRequestBudget,
  rateLimitDocId,
  rateLimitForKind,
} from '../functions/src/booking/rateLimit.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

// RATE-01 — first availability under limit → PASS
{
  assert.equal(isRateLimitExceeded(0, 'availability'), false)
  assert.equal(isRateLimitExceeded(1, 'availability'), false)
  assert.equal(rateLimitForKind('availability'), AVAILABILITY_RATE_LIMIT)
  pass('RATE-01')
}

// RATE-02 — human normal flow fits under availability limit
{
  const budget = normalBookingFlowRequestBudget()
  assert.ok(budget < AVAILABILITY_RATE_LIMIT)
  assert.ok(budget <= 12)
  // open + next month + back + select refetch + occasional reloads
  for (let i = 0; i < budget; i++) {
    assert.equal(isRateLimitExceeded(i, 'availability'), false)
  }
  pass('RATE-02')
}

// RATE-03 — identical concurrent requests coalesce (frontend in-flight map)
{
  const service = read('src/features/presentation/services/publicBooking.service.ts')
  assert.ok(service.includes('inflightAvailability'))
  assert.ok(service.includes('inflightAvailability.get(key)'))
  assert.ok(service.includes('inflightAvailability.set(key, promise)'))
  assert.ok(service.includes('`${input.slug}|${input.dateFrom}|${input.dateTo}`'))
  const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
  // Single logical load path (effect) — no second mount-time caller
  const calls = page.match(/getPublicBookingAvailability/g) || []
  assert.ok(calls.length <= 3) // effect + slot_taken refresh + possibly comment
  pass('RATE-03')
}

// RATE-04 — abuse exceeds threshold → 429
{
  assert.equal(isRateLimitExceeded(AVAILABILITY_RATE_LIMIT, 'availability'), true)
  assert.equal(isRateLimitExceeded(AVAILABILITY_RATE_LIMIT - 1, 'availability'), false)
  assert.equal(isRateLimitExceeded(CREATE_RATE_LIMIT, 'create'), true)
  const handlers = read('functions/src/booking/handlers.ts')
  assert.ok(handlers.includes('resource-exhausted'))
  assert.ok(handlers.includes('assertRateLimit(fingerprint(request), "availability")'))
  assert.ok(handlers.includes('assertRateLimit(fingerprint(request), "create")'))
  assert.ok(handlers.includes('assertRateLimit(fingerprint(request), "funnel")'))
  assert.ok(handlers.includes('rate_limited'))
  pass('RATE-04')
}

// RATE-05 — after window rolls, fresh bucket allows again
{
  const now = Date.parse('2026-09-10T14:30:00.000Z')
  const availId = rateLimitDocId('ip_1.2.3.4', 'availability', now)
  assert.ok(availId.includes('_avail_2026-09-10T14'))
  const nextHour = Date.parse('2026-09-10T15:00:00.000Z')
  const nextId = rateLimitDocId('ip_1.2.3.4', 'availability', nextHour)
  assert.notEqual(availId, nextId)
  assert.equal(isRateLimitExceeded(0, 'availability'), false)
  const boundary = nextRateLimitWindowMs('availability', now)
  assert.equal(boundary, nextHour)
  pass('RATE-05')
}

// RATE-06 — retry UI triggers one new query path
{
  const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
  assert.ok(page.includes('booking-availability-retry'))
  assert.ok(page.includes('Reintentar'))
  assert.ok(
    page.includes(
      'Estamos actualizando la disponibilidad. Inténtalo nuevamente en unos segundos.',
    ),
  )
  assert.ok(page.includes('availabilityReloadToken'))
  assert.ok(page.includes('retryAvailability'))
  assert.ok(page.includes("error.message === 'rate_limited'"))
  const service = read('src/features/presentation/services/publicBooking.service.ts')
  assert.ok(service.includes("return new Error('rate_limited')"))
  pass('RATE-06')
}

// Legacy daily shared 40 removed
{
  const handlers = read('functions/src/booking/handlers.ts')
  assert.ok(!handlers.includes('count >= 40'))
  assert.ok(!/`\$\{fingerprintKey\}_\$\{dayKey\}`/.test(handlers))
  pass('RATE-EXTRA-no-legacy-daily-40')
}

console.log('PRESENTACIÓN ↔ AGENDA — booking rate-limit tests: ALL PASS')
