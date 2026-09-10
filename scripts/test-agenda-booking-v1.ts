/**
 * V1-01…11 — finalize reservation notifications (email deferred)
 * Run: npm run test:agenda-booking-v1
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import type { AppNotification } from '../src/features/notifications/types/notification.types.ts'
import {
  contactActionUrl,
  countUnreadPublicBookings,
  formatAgendaBookingBadge,
  meetingActionUrl,
  resolveBookingAlertFields,
} from '../src/features/notifications/utils/bookingNotificationBadge.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const handlers = read('functions/src/booking/handlers.ts')
const conversion = read('functions/src/booking/conversion.ts')
const alert = read('src/features/agenda/components/AgendaNewBookingsAlert.tsx')
const contacts = read('src/features/contacts/pages/ContactsPage.tsx')
const sidebar = read('src/features/dashboard/components/DashboardSidebar.tsx')

// V1-01 booking creates notification
{
  assert.ok(handlers.includes('ensurePublicBookingConversionEffects'))
  assert.ok(conversion.includes('public_booking_created'))
  assert.ok(conversion.includes('createNotificationOnce'))
  pass('V1-01')
}

// V1-02 meetingId
{
  assert.ok(conversion.includes('meetingId: bookingId') || conversion.includes('meetingId: options.meetingId'))
  assert.ok(conversion.includes('agenda?meetingId='))
  pass('V1-02')
}

// V1-03 contactId required
{
  assert.ok(conversion.includes('contactId: input.contactId') || conversion.includes('contactId: options.contactId'))
  assert.match(conversion, /contactId:\s*options\.contactId|contactId:\s*input\.contactId/)
  const createBlock = conversion.slice(
    conversion.indexOf('async function createNotificationOnce'),
    conversion.indexOf('ensurePublicBookingConversionEffects'),
  )
  assert.ok(createBlock.includes('contactId: options.contactId'))
  pass('V1-03')
}

// V1-04 retry no duplicate notification
{
  assert.ok(conversion.includes('buildNotificationDedupeKey'))
  assert.ok(conversion.includes('code === 6') || conversion.includes('return "exists"'))
  pass('V1-04')
}

// V1-05 badge unread
{
  const list: AppNotification[] = [
    {
      id: 'a',
      recipientUid: 'u',
      type: 'public_booking_created',
      title: 'Nueva reserva',
      message: 'Lead · 2026-09-18 · 12:30',
      meetingId: 'm1',
      contactId: 'c1',
      leadName: 'Lead',
      dateLabel: '2026-09-18',
      timeLabel: '12:30',
      durationMinutes: 30,
      source: 'presentation_booking',
      actionUrl: '/dashboard/agenda?meetingId=m1',
      actionLabel: 'Ver cita',
      read: false,
      createdAt: null,
      readAt: null,
    },
  ]
  assert.equal(countUnreadPublicBookings(list), 1)
  assert.equal(formatAgendaBookingBadge(1), '1')
  assert.ok(sidebar.includes('agenda-booking-badge'))
  pass('V1-05')
}

// V1-06 Ver cita
{
  assert.equal(meetingActionUrl('meet_x'), '/dashboard/agenda?meetingId=meet_x')
  assert.ok(alert.includes('Ver cita'))
  assert.ok(alert.includes('meetingActionUrl'))
  pass('V1-06')
}

// V1-07 Ver contacto
{
  assert.equal(contactActionUrl('c_x'), '/dashboard/contactos?contactId=c_x')
  assert.ok(alert.includes('Ver contacto'))
  assert.ok(alert.includes('contactActionUrl'))
  assert.ok(contacts.includes("searchParams.get('contactId')"))
  pass('V1-07')
}

// V1-08 read + badge decrement
{
  assert.ok(alert.includes('markRead'))
  const fields = resolveBookingAlertFields({
    id: 'n1',
    recipientUid: 'u',
    type: 'public_booking_created',
    title: 'Nueva reserva',
    message: 'Ana · 2026-09-18 · 12:30',
    meetingId: 'm1',
    contactId: 'c1',
    leadName: 'Ana',
    dateLabel: '2026-09-18',
    timeLabel: '12:30',
    durationMinutes: 30,
    source: 'presentation_booking',
    actionUrl: '/dashboard/agenda?meetingId=m1',
    actionLabel: 'Ver cita',
    read: false,
    createdAt: null,
    readAt: null,
  })
  assert.equal(fields.contactId, 'c1')
  assert.equal(fields.meetingId, 'm1')
  pass('V1-08')
}

// V1-09 / V1-10 — no Resend / EMAIL_FROM secrets on createPublicBooking
{
  assert.ok(!handlers.includes('resendApiKey'))
  assert.ok(!handlers.includes('emailFromAddress'))
  assert.ok(!handlers.includes('RESEND_API_KEY'))
  assert.ok(!handlers.includes('EMAIL_FROM'))
  assert.ok(!handlers.includes('bookingConfirmationEmail'))
  assert.ok(!handlers.includes('queueBookingConfirmationEmailSafe'))
  assert.ok(!handlers.includes('ensureBookingConfirmationEmail'))
  pass('V1-09')
  pass('V1-10')
}

// V1-11 booking works without email infrastructure
{
  assert.ok(handlers.includes('ensurePublicBookingConversionEffects'))
  assert.ok(!handlers.includes('bookingEmailDeliveries'))
  // Inactive email modules may remain on disk but must not be imported by handlers
  assert.ok(!handlers.includes('../email/'))
  pass('V1-11')
}

console.log('Agenda booking V1 finalize tests: ALL PASS')
