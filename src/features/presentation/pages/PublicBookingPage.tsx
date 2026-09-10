import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicBookingConfirmationStep } from '@/features/presentation/components/booking/PublicBookingConfirmationStep'
import { PublicBookingDateStep } from '@/features/presentation/components/booking/PublicBookingDateStep'
import { PublicBookingDetailsStep } from '@/features/presentation/components/booking/PublicBookingDetailsStep'
import { PublicBookingProfessionalCard } from '@/features/presentation/components/booking/PublicBookingProfessionalCard'
import { PublicBookingStepper } from '@/features/presentation/components/booking/PublicBookingStepper'
import { PublicBookingSuccess } from '@/features/presentation/components/booking/PublicBookingSuccess'
import { PublicBookingTimeStep } from '@/features/presentation/components/booking/PublicBookingTimeStep'
import '@/features/presentation/components/booking/publicBooking.css'
import {
  publicBookingService,
  SESSION_OBJECTIVE_OPTIONS,
  SESSION_REASON_OPTIONS,
  type PublicBookingConfirmation,
  type PublicBookingLeadInput,
} from '@/features/presentation/services/publicBooking.service'
import {
  composeWhatsApp,
  formatLongDate,
  hasFieldErrors,
  nextTimeAfterDateChange,
  validateBookingDetails,
  type BookingStep,
  type FieldErrors,
} from '@/features/presentation/utils/publicBookingUiUtils'

function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function addDaysKey(base: Date, days: number): string {
  const d = new Date(base.getTime() + days * 86400000)
  return d.toISOString().slice(0, 10)
}

const emptyLead: PublicBookingLeadInput = {
  firstName: '',
  lastName: '',
  email: '',
  country: '',
  city: '',
  whatsapp: '',
  sessionReason: SESSION_REASON_OPTIONS[0],
  objective: SESSION_OBJECTIVE_OPTIONS[0],
  message: '',
  privacyAccepted: false,
}

export function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [step, setStep] = useState<BookingStep>(1)
  const [lead, setLead] = useState<PublicBookingLeadInput>(emptyLead)
  const [dialCode, setDialCode] = useState('+34')
  const [localWhatsApp, setLocalWhatsApp] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [professionalName, setProfessionalName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [brandName, setBrandName] = useState('')
  const [claim, setClaim] = useState('')
  const [timezone, setTimezone] = useState('Europe/Madrid')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [dates, setDates] = useState<Record<string, string[]>>({})
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null)
  const [clientRequestId] = useState(() => createClientRequestId())
  const [loadFailedNotFound, setLoadFailedNotFound] = useState(false)
  const notFound = !slug || loadFailedNotFound

  const dateKeys = useMemo(() => Object.keys(dates).sort(), [dates])
  const timesForDate = selectedDate ? dates[selectedDate] || [] : []
  const dateLabel = selectedDate ? formatLongDate(selectedDate) : ''

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    const from = addDaysKey(new Date(), 0)
    const to = addDaysKey(new Date(), 30)

    queueMicrotask(() => {
      if (cancelled) return
      setAvailabilityLoading(true)
      setAvailabilityError('')
    })

    void publicBookingService
      .getPublicBookingAvailability({ slug, dateFrom: from, dateTo: to })
      .then((availability) => {
        if (cancelled) return
        const professional = availability.professional
        setProfessionalName(
          professional?.displayName?.trim() ||
            availability.professionalName?.trim() ||
            'Profesional',
        )
        setPhotoUrl(professional?.avatarUrl?.trim() || '')
        setBrandName(professional?.brandName?.trim() || '')
        setClaim(professional?.claim?.trim() || '')
        setTimezone(availability.timezone)
        setDurationMinutes(availability.durationMinutes)
        setDates(availability.dates || {})

        const keys = Object.keys(availability.dates || {}).sort()
        if (keys[0]) {
          const [y, m] = keys[0].split('-').map(Number)
          if (y && m) {
            setCalendarYear(y)
            setCalendarMonth(m)
          }
        }
      })
      .catch((error: Error) => {
        if (cancelled) return
        if (error.message === 'not-found') setLoadFailedNotFound(true)
        else setAvailabilityError('No pudimos cargar la disponibilidad. Inténtalo de nuevo.')
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  function patchLead(patch: Partial<PublicBookingLeadInput>) {
    setLead((current) => ({ ...current, ...patch }))
  }

  function handleContinueFromDetails() {
    const whatsapp = composeWhatsApp(dialCode, localWhatsApp)
    const nextLead = { ...lead, whatsapp }
    setLead(nextLead)
    const errors = validateBookingDetails(nextLead)
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) return
    setSubmitError('')
    setStep(2)
  }

  function handleSelectDate(dateKey: string) {
    setSelectedTime((prev) => nextTimeAfterDateChange(selectedDate, dateKey, prev))
    setSelectedDate(dateKey)
  }

  async function confirmBooking() {
    if (!slug || !selectedDate || !selectedTime || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const whatsapp = composeWhatsApp(dialCode, localWhatsApp)
      const result = await publicBookingService.createPublicBooking({
        slug,
        selectedDate,
        selectedTime,
        clientRequestId,
        leadData: {
          ...lead,
          firstName: lead.firstName.trim(),
          lastName: lead.lastName.trim(),
          email: lead.email.trim().toLowerCase(),
          country: lead.country.trim(),
          city: lead.city.trim(),
          whatsapp: whatsapp.trim(),
          message: lead.message.trim(),
        },
      })
      setConfirmation(result)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'temporary'
      if (code === 'slot_taken') {
        setSubmitError('Ese horario acaba de reservarse. Elige otro disponible.')
        setSelectedTime('')
        setStep(3)
        const from = addDaysKey(new Date(), 0)
        const to = addDaysKey(new Date(), 30)
        void publicBookingService
          .getPublicBookingAvailability({ slug, dateFrom: from, dateTo: to })
          .then((result) => setDates(result.dates || {}))
          .catch(() => undefined)
      } else if (code === 'privacy_required') {
        setSubmitError('Debes aceptar el tratamiento de datos.')
        setStep(1)
      } else {
        setSubmitError('No pudimos completar la reserva. Inténtalo nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <main className="pb-notfound">
        <div>
          <h1 className="pb-title">Reserva no disponible</h1>
          <p style={{ color: 'var(--color-text-soft)' }}>
            Este enlace no existe, no está activo o no admite reservas.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/" className="pb-btn pb-btn-secondary" style={{ display: 'inline-flex' }}>
              Volver al inicio
            </Link>
          </p>
        </div>
      </main>
    )
  }

  const showSuccess = Boolean(confirmation)
  const wizardStep: BookingStep = showSuccess ? 4 : step

  return (
    <main className="pb-shell">
      <div className="pb-layout">
        <PublicBookingProfessionalCard
          name={professionalName || 'Profesional'}
          brandName={
            brandName && brandName !== professionalName ? brandName : undefined
          }
          claim={claim || undefined}
          photoUrl={photoUrl || undefined}
          durationMinutes={durationMinutes}
          timezone={timezone}
        />

        <div className="pb-wizard">
          {!showSuccess ? <PublicBookingStepper current={wizardStep} /> : null}

          {availabilityError ? (
            <p className="pb-banner" data-tone="error" role="alert">
              {availabilityError}
            </p>
          ) : null}

          {showSuccess && confirmation ? (
            <PublicBookingSuccess
              professionalName={confirmation.professionalName}
              dateLabel={formatLongDate(confirmation.date)}
              time={confirmation.time}
              durationMinutes={confirmation.duration}
            />
          ) : null}

          {!showSuccess && step === 1 ? (
            <PublicBookingDetailsStep
              lead={lead}
              dialCode={dialCode}
              localWhatsApp={localWhatsApp}
              fieldErrors={fieldErrors}
              onLeadChange={(patch) => {
                patchLead(patch)
                setFieldErrors((current) => {
                  const next = { ...current }
                  for (const key of Object.keys(patch) as (keyof FieldErrors)[]) {
                    delete next[key]
                  }
                  return next
                })
              }}
              onDialCodeChange={setDialCode}
              onLocalWhatsAppChange={setLocalWhatsApp}
              onContinue={handleContinueFromDetails}
            />
          ) : null}

          {!showSuccess && step === 2 ? (
            <PublicBookingDateStep
              year={calendarYear}
              month={calendarMonth}
              dates={dates}
              selectedDate={selectedDate}
              loading={availabilityLoading}
              empty={!availabilityLoading && dateKeys.length === 0}
              onMonthChange={(y, m) => {
                setCalendarYear(y)
                setCalendarMonth(m)
              }}
              onSelectDate={handleSelectDate}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          ) : null}

          {!showSuccess && step === 3 ? (
            <PublicBookingTimeStep
              selectedDateLabel={dateLabel}
              times={timesForDate}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              onBack={() => setStep(2)}
              onContinue={() => setStep(4)}
            />
          ) : null}

          {!showSuccess && step === 4 ? (
            <PublicBookingConfirmationStep
              professionalName={professionalName}
              dateLabel={dateLabel}
              time={selectedTime}
              durationMinutes={durationMinutes}
              participantName={`${lead.firstName.trim()} ${lead.lastName.trim()}`.trim()}
              reason={lead.sessionReason}
              objective={lead.objective}
              submitting={submitting}
              error={submitError || undefined}
              onBack={() => {
                setSubmitError('')
                setStep(3)
              }}
              onConfirm={() => void confirmBooking()}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}
