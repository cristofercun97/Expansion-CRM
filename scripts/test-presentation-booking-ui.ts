/**
 * PRESENTACIÓN ↔ AGENDA — FASE 2 UI smoke (UI-01…09)
 * Run: npm run test:presentation-booking-ui
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildMonthCells,
  formatLongDate,
  hasFieldErrors,
  isDateAvailable,
  nextTimeAfterDateChange,
  stepStatus,
  validateBookingDetails,
} from '../src/features/presentation/utils/publicBookingUiUtils.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const page = read('src/features/presentation/pages/PublicBookingPage.tsx')
const css = read('src/features/presentation/components/booking/publicBooking.css')
const details = read(
  'src/features/presentation/components/booking/PublicBookingDetailsStep.tsx',
)
const dateStep = read('src/features/presentation/components/booking/PublicBookingDateStep.tsx')
const timeStep = read('src/features/presentation/components/booking/PublicBookingTimeStep.tsx')
const confirm = read(
  'src/features/presentation/components/booking/PublicBookingConfirmationStep.tsx',
)
const success = read('src/features/presentation/components/booking/PublicBookingSuccess.tsx')
const stepper = read('src/features/presentation/components/booking/PublicBookingStepper.tsx')

// UI-01 — step navigation structure
{
  assert.ok(page.includes('setStep(2)'))
  assert.ok(page.includes('setStep(3)'))
  assert.ok(page.includes('setStep(4)'))
  assert.ok(page.includes('setStep(1)'))
  const utils = read('src/features/presentation/utils/publicBookingUiUtils.ts')
  assert.ok(utils.includes('Cuéntanos sobre ti'))
  assert.ok(utils.includes('Elige una fecha'))
  assert.ok(utils.includes('Elige una hora'))
  assert.ok(utils.includes('Confirma tu cita'))
  assert.ok(stepper.includes('BOOKING_STEP_LABELS'))
  assert.equal(stepStatus(1, 2), 'complete')
  assert.equal(stepStatus(2, 2), 'active')
  assert.equal(stepStatus(3, 2), 'pending')
  pass('UI-01')
}

// UI-02 — back preserves data (lead state not cleared on back)
{
  assert.ok(page.includes('onBack={() => setStep(1)}') || page.includes('setStep(1)'))
  assert.ok(!page.includes('setLead(emptyLead)'))
  assert.ok(!page.includes('setLead({'))
  pass('UI-02')
}

// UI-03 — changing date resets time
{
  assert.equal(nextTimeAfterDateChange('2026-09-18', '2026-09-19', '10:00'), '')
  assert.equal(nextTimeAfterDateChange('2026-09-18', '2026-09-18', '10:00'), '10:00')
  assert.ok(page.includes('nextTimeAfterDateChange'))
  pass('UI-03')
}

// UI-04 — unavailable date disabled
{
  const dates = { '2026-09-18': ['09:00'] }
  const cells = buildMonthCells(2026, 9, dates, new Date('2026-09-10T12:00:00'))
  const available = cells.find((c) => c.dateKey === '2026-09-18')
  const emptyDay = cells.find((c) => c.dateKey === '2026-09-19')
  assert.ok(available?.available)
  assert.ok(emptyDay && !emptyDay.available)
  assert.ok(dateStep.includes('disabled={disabled}'))
  assert.ok(!isDateAvailable('2026-09-19', dates))
  pass('UI-04')
}

// UI-05 — selected date state
{
  assert.ok(dateStep.includes("data-state={state}") || dateStep.includes("data-state="))
  assert.ok(dateStep.includes("'selected'"))
  assert.ok(css.includes(".pb-day[data-state='selected']"))
  pass('UI-05')
}

// UI-06 — selected time state
{
  assert.ok(timeStep.includes("data-selected={selected ? 'true' : 'false'}"))
  assert.ok(css.includes(".pb-slot[data-selected='true']"))
  pass('UI-06')
}

// UI-07 — confirm summary correct
{
  assert.ok(confirm.includes('Confirma tu cita'))
  assert.ok(confirm.includes('booking-summary'))
  assert.ok(confirm.includes('Coach'))
  assert.ok(confirm.includes('Fecha'))
  assert.ok(confirm.includes('Hora'))
  assert.ok(confirm.includes('Duración'))
  assert.ok(confirm.includes('Participante'))
  assert.ok(confirm.includes('Motivo'))
  assert.ok(confirm.includes('Confirmar cita'))
  assert.ok(formatLongDate('2026-09-18').toLowerCase().includes('septiembre'))
  pass('UI-07')
}

// UI-08 — success state
{
  assert.ok(success.includes('Cita confirmada'))
  assert.ok(success.includes('Tu encuentro ha sido reservado correctamente.'))
  assert.ok(page.includes('PublicBookingSuccess'))
  assert.ok(page.includes('confirmation'))
  pass('UI-08')
}

// UI-09 — mobile no horizontal overflow
{
  assert.ok(css.includes('overflow-x: hidden'))
  assert.ok(css.includes('@media (max-width: 959px)'))
  assert.ok(css.includes('.pb-pro-claim'))
  assert.ok(css.includes('display: none'))
  assert.ok(css.includes('grid-template-columns: repeat(7, minmax(0, 1fr))'))
  assert.ok(details.includes('pb-btn-block'))
  pass('UI-09')
}

// Extra: validation UX inline (no window.alert)
{
  const errors = validateBookingDetails({
    firstName: '',
    lastName: '',
    email: 'bad',
    country: '',
    city: '',
    whatsapp: '',
    sessionReason: '',
    objective: '',
    message: '',
    privacyAccepted: false,
  })
  assert.ok(hasFieldErrors(errors))
  assert.ok(errors.firstName)
  assert.ok(errors.email)
  assert.ok(!page.includes('window.alert'))
  assert.ok(!details.includes('alert('))
  pass('UI-EXTRA-validation')
}

console.log('PRESENTACIÓN ↔ AGENDA — FASE 2 UI tests: ALL PASS')
