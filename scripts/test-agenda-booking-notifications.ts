/**
 * NOTIF-01…06 — Agenda badge for unread public_booking_created
 * Run: npm run test:agenda-booking-notifications
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import type { AppNotification } from '../src/features/notifications/types/notification.types.ts'
import {
  countUnreadPublicBookings,
  formatAgendaBookingBadge,
  isUnreadPublicBookingNotification,
  selectUnreadPublicBookings,
} from '../src/features/notifications/utils/bookingNotificationBadge.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function notif(partial: Partial<AppNotification> & Pick<AppNotification, 'id' | 'type' | 'read'>): AppNotification {
  return {
    recipientUid: 'owner1',
    title: 'Nueva reserva',
    message: 'Lead · 2026-09-18 · 12:30',
    meetingId: 'm1',
    contactId: 'c1',
    leadName: 'María López',
    dateLabel: '2026-09-18',
    timeLabel: '12:30',
    durationMinutes: 30,
    source: 'presentation_booking',
    actionUrl: '/dashboard/agenda?meetingId=m1',
    actionLabel: 'Ver cita',
    createdAt: null,
    readAt: null,
    ...partial,
  }
}

// NOTIF-01
{
  const list = [notif({id: 'a', type: 'public_booking_created', read: false})]
  assert.equal(countUnreadPublicBookings(list), 1)
  assert.equal(formatAgendaBookingBadge(1), '1')
  pass('NOTIF-01')
}

// NOTIF-02
{
  const list = [
    notif({id: 'a', type: 'public_booking_created', read: false}),
    notif({id: 'b', type: 'public_booking_created', read: false}),
    notif({id: 'c', type: 'public_booking_created', read: false}),
  ]
  assert.equal(countUnreadPublicBookings(list), 3)
  assert.equal(formatAgendaBookingBadge(3), '3')
  pass('NOTIF-02')
}

// NOTIF-03
{
  const list = [notif({id: 'a', type: 'public_booking_created', read: true})]
  assert.equal(countUnreadPublicBookings(list), 0)
  assert.equal(formatAgendaBookingBadge(0), '')
  pass('NOTIF-03')
}

// NOTIF-04
{
  const list = [notif({id: 'a', type: 'meeting_reminder', read: false})]
  assert.equal(isUnreadPublicBookingNotification(list[0]), false)
  assert.equal(countUnreadPublicBookings(list), 0)
  pass('NOTIF-04')
}

// NOTIF-05 — filtering is by current user's subscription (recipientUid query)
{
  const service = read('src/features/notifications/services/notifications.service.ts')
  assert.ok(service.includes("where('recipientUid', '==', uid)"))
  assert.ok(service.includes('onSnapshot'))
  const sidebar = read('src/features/dashboard/components/DashboardSidebar.tsx')
  assert.ok(sidebar.includes('agenda-booking-badge'))
  assert.ok(sidebar.includes("item.to === '/dashboard/agenda'"))
  pass('NOTIF-05')
}

// NOTIF-06
{
  const list = [
    notif({id: 'a', type: 'public_booking_created', read: false}),
    notif({id: 'b', type: 'public_booking_created', read: false}),
    notif({id: 'c', type: 'public_booking_created', read: false}),
  ]
  assert.equal(countUnreadPublicBookings(list), 3)
  list[0] = {...list[0], read: true}
  assert.equal(countUnreadPublicBookings(list), 2)
  assert.equal(formatAgendaBookingBadge(2), '2')
  assert.equal(formatAgendaBookingBadge(100), '99+')
  pass('NOTIF-06')
}

{
  const selected = selectUnreadPublicBookings(
    [
      notif({id: '1', type: 'public_booking_created', read: false}),
      notif({id: '2', type: 'public_booking_created', read: false}),
      notif({id: '3', type: 'public_booking_created', read: false}),
      notif({id: '4', type: 'public_booking_created', read: false}),
    ],
    3,
  )
  assert.equal(selected.items.length, 3)
  assert.equal(selected.total, 4)
  assert.equal(selected.hasMore, true)
  pass('NOTIF-EXTRA-select')
}

console.log('Agenda booking notification badge tests: ALL PASS')
