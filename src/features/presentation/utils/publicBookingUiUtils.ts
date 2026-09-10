/** Pure helpers for public booking UI (Fase 2). No backend coupling. */

export type BookingStep = 1 | 2 | 3 | 4

export const BOOKING_STEP_LABELS = [
  'Cuéntanos sobre ti',
  'Elige una fecha',
  'Elige una hora',
  'Confirma tu cita',
] as const

/** Compact stepper labels (visual only). Step page titles stay in BOOKING_STEP_LABELS. */
export const BOOKING_STEPPER_LABELS = ['Datos', 'Fecha', 'Hora', 'Confirmación'] as const

export type FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'email'
    | 'country'
    | 'city'
    | 'sessionReason'
    | 'objective'
    | 'message'
    | 'privacyAccepted',
    string
  >
>

export type LeadLike = {
  firstName: string
  lastName: string
  email: string
  country: string
  city: string
  whatsapp: string
  sessionReason: string
  objective: string
  message: string
  privacyAccepted: boolean
}

export const WHATSAPP_DIAL_CODES = [
  { code: '+34', label: 'ES +34' },
  { code: '+52', label: 'MX +52' },
  { code: '+57', label: 'CO +57' },
  { code: '+51', label: 'PE +51' },
  { code: '+56', label: 'CL +56' },
  { code: '+54', label: 'AR +54' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
] as const

export function validateBookingDetails(lead: LeadLike): FieldErrors {
  const errors: FieldErrors = {}
  if (!lead.firstName.trim()) errors.firstName = 'El nombre es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) {
    errors.email = 'Introduce un email válido.'
  }
  if (!lead.country.trim()) errors.country = 'El país es obligatorio.'
  if (!lead.city.trim()) errors.city = 'La ciudad es obligatoria.'
  if (!lead.message.trim()) errors.message = 'El mensaje es obligatorio.'
  else if (lead.message.trim().length > 500) errors.message = 'Máximo 500 caracteres.'
  if (!lead.privacyAccepted) {
    errors.privacyAccepted = 'Debes aceptar el tratamiento de datos.'
  }
  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

/** When date changes, clear selected time. */
export function nextTimeAfterDateChange(
  previousDate: string,
  nextDate: string,
  previousTime: string,
): string {
  if (previousDate === nextDate) return previousTime
  return ''
}

export function isDateAvailable(
  dateKey: string,
  dates: Record<string, string[]>,
): boolean {
  return Array.isArray(dates[dateKey]) && dates[dateKey].length > 0
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function todayDateKey(now = new Date()): string {
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export type CalendarCell = {
  dateKey: string | null
  day: number | null
  inMonth: boolean
  available: boolean
  past: boolean
  isToday: boolean
}

/** Build Mon–Sun calendar grid for a month (weeks padded). */
export function buildMonthCells(
  year: number,
  month: number,
  dates: Record<string, string[]>,
  now = new Date(),
): CalendarCell[] {
  const todayKey = todayDateKey(now)
  const first = new Date(year, month - 1, 1)
  // Monday-first: JS Sunday=0 → convert
  const mondayIndex = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let i = 0; i < mondayIndex; i += 1) {
    cells.push({
      dateKey: null,
      day: null,
      inMonth: false,
      available: false,
      past: true,
      isToday: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(year, month, day)
    const available = isDateAvailable(dateKey, dates)
    const past = dateKey < todayKey
    cells.push({
      dateKey,
      day,
      inMonth: true,
      available: available && !past,
      past,
      isToday: dateKey === todayKey,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: null,
      day: null,
      inMonth: false,
      available: false,
      past: true,
      isToday: false,
    })
  }

  return cells
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function formatMonthTitle(year: number, month: number, locale = 'es-ES'): string {
  const raw = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatLongDate(dateKey: string, locale = 'es-ES'): string {
  const parts = parseDateKey(dateKey)
  if (!parts) return dateKey
  const raw = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(parts.year, parts.month - 1, parts.day))
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function composeWhatsApp(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return ''
  const codeDigits = dialCode.replace(/\D/g, '')
  return `+${codeDigits}${digits}`
}

export function splitWhatsApp(value: string): { dialCode: string; localNumber: string } {
  const trimmed = value.trim()
  if (!trimmed) return { dialCode: '+34', localNumber: '' }
  for (const item of WHATSAPP_DIAL_CODES) {
    if (trimmed.startsWith(item.code)) {
      return { dialCode: item.code, localNumber: trimmed.slice(item.code.length).trim() }
    }
  }
  return { dialCode: '+34', localNumber: trimmed.replace(/^\+/, '') }
}

export function participantDisplayName(lead: Pick<LeadLike, 'firstName' | 'lastName'>): string {
  return `${lead.firstName.trim()} ${lead.lastName.trim()}`.trim()
}

export function stepStatus(
  step: BookingStep,
  current: BookingStep,
): 'complete' | 'active' | 'pending' {
  if (step < current) return 'complete'
  if (step === current) return 'active'
  return 'pending'
}
