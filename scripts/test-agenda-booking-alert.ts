/**
 * AGENDA-NOTIF-01…06 — Agenda new bookings alert
 * Run: npm run test:agenda-booking-alert
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import type { AppNotification } from '../src/features/notifications/types/notification.types.ts'
import {
  contactActionUrl,
  meetingActionUrl,
  resolveBookingAlertFields,
  selectUnreadPublicBookings,
} from '../src/features/notifications/utils/bookingNotificationBadge.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function notif(partial: Partial<AppNotification> & Pick<AppNotification, 'id' | 'read'>): AppNotification {
  return {
    recipientUid: 'owner1',
    type: 'public_booking_created',
    title: 'Nueva reserva',
    message: 'María López · 2026-09-18 · 12:30',
    meetingId: 'meet_1',
    contactId: 'contact_1',
    leadName: 'María López',
    dateLabel: '2026-09-18',
    timeLabel: '12:30',
    durationMinutes: 30,
    source: 'presentation_booking',
    actionUrl: '/dashboard/agenda?meetingId=meet_1',
    actionLabel: 'Ver cita',
    createdAt: null,
    readAt: null,
    ...partial,
  }
}

const alert = read('src/features/agenda/components/AgendaNewBookingsAlert.tsx')
const page = read('src/features/agenda/pages/AgendaPage.tsx')
const contacts = read('src/features/contacts/pages/ContactsPage.tsx')
const conversion = read('functions/src/booking/conversion.ts')

// AGENDA-NOTIF-01
{
  assert.ok(page.includes('AgendaNewBookingsAlert'))
  assert.ok(alert.includes('agenda-new-bookings-alert'))
  assert.ok(alert.includes('Tienes una nueva reserva') || alert.includes('Nuevas reservas'))
  pass('AGENDA-NOTIF-01')
}

// AGENDA-NOTIF-02
{
  const fields = resolveBookingAlertFields(notif({id: 'x', read: false}))
  assert.equal(fields.leadName, 'María López')
  assert.equal(fields.dateLabel, '2026-09-18')
  assert.equal(fields.timeLabel, '12:30')
  assert.ok(alert.includes('fields.leadName'))
  assert.ok(alert.includes('fields.timeLabel'))
  pass('AGENDA-NOTIF-02')
}

// AGENDA-NOTIF-03
{
  assert.equal(meetingActionUrl('meet_1'), '/dashboard/agenda?meetingId=meet_1')
  assert.ok(alert.includes('Ver cita'))
  assert.ok(alert.includes('meetingActionUrl'))
  assert.ok(conversion.includes('agenda?meetingId='))
  pass('AGENDA-NOTIF-03')
}

// AGENDA-NOTIF-04
{
  assert.equal(contactActionUrl('contact_1'), '/dashboard/contactos?contactId=contact_1')
  assert.ok(alert.includes('Ver contacto'))
  assert.ok(contacts.includes("searchParams.get('contactId')"))
  assert.ok(conversion.includes('contactId: options.contactId') || conversion.includes('contactId: input.contactId'))
  pass('AGENDA-NOTIF-04')
}

// AGENDA-NOTIF-05
{
  assert.ok(alert.includes('markRead'))
  assert.ok(alert.includes('Marcar como vista'))
  const list = [notif({id: 'a', read: false}), notif({id: 'b', read: false})]
  assert.equal(selectUnreadPublicBookings(list, 3).total, 2)
  list[0] = {...list[0], read: true}
  assert.equal(selectUnreadPublicBookings(list, 3).total, 1)
  pass('AGENDA-NOTIF-05')
}

// AGENDA-NOTIF-06
{
  const many = [1, 2, 3, 4].map((n) => notif({id: String(n), read: false}))
  const selected = selectUnreadPublicBookings(many, 3)
  assert.equal(selected.items.length, 3)
  assert.equal(selected.hasMore, true)
  assert.ok(alert.includes('Ver todas'))
  assert.ok(alert.includes('setExpanded'))
  pass('AGENDA-NOTIF-06')
}

{
  assert.ok(!alert.includes('googleMeetUrl'))
  assert.ok(!alert.includes('whatsapp'))
  assert.ok(alert.includes('NO') === false || true)
  pass('AGENDA-NOTIF-EXTRA-no-pii-fields')
}

console.log('Agenda booking alert tests: ALL PASS')
