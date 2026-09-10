/**
 * Agenda UI — day details CTA date preselect
 * Run: npx vite-node scripts/test-agenda-day-preselect.ts
 */
import assert from 'node:assert/strict'
import { buildMeetingFormValues } from '../src/features/agenda/utils/meetingForm'
import {
  startOfDay,
  toDateInputValue,
} from '../src/features/agenda/utils/meetingDateUtils'

function resolveCreateInitialDate(options: {
  source: 'global' | 'day_details'
  selectedDay: Date | null
}): Date | null {
  if (options.source === 'day_details' && options.selectedDay) {
    return startOfDay(options.selectedDay)
  }
  return null
}

function testSelectedDayCtaPrefillsDate() {
  const selected = new Date(2026, 3, 10, 15, 30, 0) // Thu 10 Apr local
  const initialDate = resolveCreateInitialDate({
    source: 'day_details',
    selectedDay: selected,
  })
  assert.ok(initialDate)
  const values = buildMeetingFormValues({
    mode: 'create',
    contacts: [],
    preferGoogleMeetDefault: false,
    initialDate,
  })
  assert.equal(values.date, '2026-04-10')
  assert.match(values.time, /^\d{2}:\d{2}$/)
  console.log('PASS SELECTED-DAY CTA date prefill')
}

function testGlobalNewMeetingKeepsDefaultDate() {
  const initialDate = resolveCreateInitialDate({
    source: 'global',
    selectedDay: new Date(2026, 3, 10),
  })
  assert.equal(initialDate, null)
  const values = buildMeetingFormValues({
    mode: 'create',
    contacts: [],
    preferGoogleMeetDefault: false,
    initialDate,
  })
  const today = toDateInputValue(new Date())
  assert.equal(values.date, today)
  console.log('PASS GLOBAL Nueva reunión default date')
}

function testChangingDayUpdatesCtaDate() {
  const first = resolveCreateInitialDate({
    source: 'day_details',
    selectedDay: new Date(2026, 3, 10),
  })
  const second = resolveCreateInitialDate({
    source: 'day_details',
    selectedDay: new Date(2026, 3, 11),
  })
  assert.ok(first && second)
  const a = buildMeetingFormValues({
    mode: 'create',
    contacts: [],
    preferGoogleMeetDefault: false,
    initialDate: first,
  })
  const b = buildMeetingFormValues({
    mode: 'create',
    contacts: [],
    preferGoogleMeetDefault: false,
    initialDate: second,
  })
  assert.equal(a.date, '2026-04-10')
  assert.equal(b.date, '2026-04-11')
  assert.notEqual(a.date, b.date)
  console.log('PASS CHANGE-DAY CTA uses new date')
}

function testTimezoneLocalDateBoundary() {
  const lateLocal = new Date(2026, 3, 10, 23, 30, 0)
  const values = buildMeetingFormValues({
    mode: 'create',
    contacts: [],
    preferGoogleMeetDefault: false,
    initialDate: startOfDay(lateLocal),
  })
  assert.equal(values.date, toDateInputValue(lateLocal))
  assert.equal(values.date, '2026-04-10')
  console.log('PASS TIMEZONE local date')
}

testSelectedDayCtaPrefillsDate()
testGlobalNewMeetingKeepsDefaultDate()
testChangingDayUpdatesCtaDate()
testTimezoneLocalDateBoundary()
console.log('Agenda day preselect tests OK')
