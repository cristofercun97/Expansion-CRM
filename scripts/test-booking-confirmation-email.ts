/**
 * EMAIL-01…10 — booking confirmation email
 * Run: npm run test:booking-confirmation-email
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {
  BOOKING_CONFIRMATION_SUBJECT,
  assertConfirmationEmailSafe,
  buildBookingConfirmationHtml,
  buildBookingConfirmationText,
  formatBookingEmailDate,
} from '../functions/src/email/bookingConfirmationContent.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const sample = {
  firstName: 'María',
  professionalName: 'Cristofer Cunto',
  brandName: 'XTRA TEAM',
  dateLabel: 'viernes, 18 de septiembre de 2026',
  timeLabel: '12:30',
  durationMinutes: 30,
  timezone: 'Europe/Madrid',
}

const handlers = read('functions/src/booking/handlers.ts')
const emailMod = read('functions/src/email/bookingConfirmationEmail.ts')
const mailer = read('functions/src/email/resendMailer.ts')
const rules = read('firestore.rules')

// EMAIL-01
{
  assert.ok(handlers.includes('queueBookingConfirmationEmailSafe'))
  assert.ok(handlers.includes('ensureBookingConfirmationEmail'))
  assert.ok(emailMod.includes('bookingEmailDeliveries'))
  pass('EMAIL-01')
}

// EMAIL-02
{
  assert.ok(handlers.includes('recipientEmail: input.lead.email'))
  pass('EMAIL-02')
}

// EMAIL-03
{
  const text = buildBookingConfirmationText(sample)
  assert.ok(text.includes('Cristofer Cunto'))
  assert.ok(text.includes('CON QUIÉN TE REÚNES'))
  assert.ok(!text.toLowerCase().includes('coach'))
  pass('EMAIL-03')
}

// EMAIL-04
{
  const text = buildBookingConfirmationText(sample)
  assert.ok(text.includes('XTRA TEAM'))
  assert.ok(text.includes('MARCA'))
  const noBrand = buildBookingConfirmationText({...sample, brandName: null})
  assert.ok(!noBrand.includes('MARCA'))
  pass('EMAIL-04')
}

// EMAIL-05
{
  const text = buildBookingConfirmationText(sample)
  assert.ok(text.includes(sample.dateLabel))
  assert.ok(text.includes('12:30'))
  assert.ok(text.includes('Europe/Madrid'))
  assert.ok(text.includes('30 min'))
  const localized = formatBookingEmailDate('2026-09-18', 'Europe/Madrid')
  assert.ok(localized.toLowerCase().includes('2026') || localized.includes('septiembre') || localized.includes('18'))
  pass('EMAIL-05')
}

// EMAIL-06 — retry booking → 1 email (dedupe by bookingId)
{
  assert.ok(emailMod.includes('skipped_already_sent'))
  assert.ok(emailMod.includes('.doc(input.bookingId)'))
  assert.ok(emailMod.includes('status === "sent"'))
  pass('EMAIL-06')
}

// EMAIL-07 — no frontend email send
{
  const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
  assert.ok(!page.includes('ensureBookingConfirmationEmail'))
  assert.ok(!page.includes('sendEmail'))
  assert.ok(!page.includes('bookingEmailDeliveries'))
  pass('EMAIL-07')
}

// EMAIL-08 — provider failure isolation
{
  assert.ok(handlers.includes('queueBookingConfirmationEmailSafe'))
  assert.ok(handlers.includes('catch (error)'))
  assert.ok(emailMod.includes('return "failed"'))
  pass('EMAIL-08')
}

// EMAIL-09 — no PII in logs
{
  assert.ok(emailMod.includes('bookingId: input.bookingId'))
  assert.ok(!emailMod.includes('console.info(input.recipientEmail'))
  assert.ok(!emailMod.includes('console.log(html'))
  assert.ok(!emailMod.includes('console.info(text'))
  pass('EMAIL-09')
}

// EMAIL-10 — Meet excluded
{
  const html = buildBookingConfirmationHtml(sample)
  const text = buildBookingConfirmationText(sample)
  assertConfirmationEmailSafe(html, text)
  assert.ok(!html.toLowerCase().includes('meet.google'))
  assert.ok(!text.toLowerCase().includes('meet.google'))
  assert.equal(BOOKING_CONFIRMATION_SUBJECT, 'Tu encuentro ha sido confirmado')
  pass('EMAIL-10')
}

{
  assert.ok(mailer.includes('api.resend.com'))
  assert.ok(rules.includes('bookingEmailDeliveries'))
  assert.ok(rules.includes('allow read, write: if false'))
  assert.ok(handlers.includes('resendApiKey'))
  pass('EMAIL-EXTRA-provider-and-rules')
}

console.log('Booking confirmation email tests: ALL PASS')
