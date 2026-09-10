import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  publicBookingService,
  SESSION_OBJECTIVE_OPTIONS,
  SESSION_REASON_OPTIONS,
  type PublicBookingConfirmation,
  type PublicBookingLeadInput,
} from '@/features/presentation/services/publicBooking.service'

type Step = 1 | 2 | 3 | 4

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
  const [step, setStep] = useState<Step>(1)
  const [lead, setLead] = useState<PublicBookingLeadInput>(emptyLead)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [professionalName, setProfessionalName] = useState('')
  const [bookingTitle, setBookingTitle] = useState('')
  const [timezone, setTimezone] = useState('Europe/Madrid')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [dates, setDates] = useState<Record<string, string[]>>({})
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null)
  const [clientRequestId] = useState(() => createClientRequestId())
  const [loadFailedNotFound, setLoadFailedNotFound] = useState(false)
  const notFoundMissingSlug = !slug
  const notFound = notFoundMissingSlug || loadFailedNotFound

  const dateKeys = useMemo(() => Object.keys(dates).sort(), [dates])
  const timesForDate = selectedDate ? dates[selectedDate] || [] : []

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
      .then((result) => {
        if (cancelled) return
        setProfessionalName(result.professionalName)
        setBookingTitle(result.bookingTitle)
        setTimezone(result.timezone)
        setDurationMinutes(result.durationMinutes)
        setDates(result.dates || {})
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

  function validateStep1(): string | null {
    if (!lead.firstName.trim()) return 'El nombre es obligatorio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) return 'Email inválido.'
    if (!lead.country.trim() || !lead.city.trim()) return 'País y ciudad son obligatorios.'
    if (!lead.sessionReason || !lead.objective || !lead.message.trim()) {
      return 'Completa motivo, objetivo y mensaje.'
    }
    if (lead.message.trim().length > 500) return 'El mensaje máximo es 500 caracteres.'
    if (!lead.privacyAccepted) return 'Debes aceptar la política de privacidad.'
    return null
  }

  async function confirmBooking() {
    if (!slug || !selectedDate || !selectedTime || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
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
          whatsapp: lead.whatsapp.trim(),
          message: lead.message.trim(),
        },
      })
      setConfirmation(result)
      setStep(4)
    } catch (error) {
      const code = error instanceof Error ? error.message : 'temporary'
      if (code === 'slot_taken') {
        setSubmitError('Ese horario acaba de reservarse. Elige otro disponible.')
        setStep(3)
        // refresh availability
        const from = addDaysKey(new Date(), 0)
        const to = addDaysKey(new Date(), 30)
        void publicBookingService
          .getPublicBookingAvailability({ slug, dateFrom: from, dateTo: to })
          .then((result) => setDates(result.dates || {}))
          .catch(() => undefined)
      } else if (code === 'privacy_required') {
        setSubmitError('Debes aceptar la política de privacidad.')
        setStep(1)
      } else {
        setSubmitError('No pudimos confirmar la reserva. Inténtalo de nuevo en unos minutos.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Reserva no disponible</h1>
        <p className="text-sm text-slate-600">
          Este enlace no existe, no está activo o no admite reservas.
        </p>
        <Link to="/" className="text-sm font-semibold text-teal-700 underline">
          Volver al inicio
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Reserva</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        {bookingTitle || 'Agendar mi encuentro'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {professionalName ? `Con ${professionalName}` : 'Elige un horario disponible'}
        {` · ${durationMinutes} min · ${timezone}`}
      </p>

      <ol className="mt-6 flex gap-2 text-xs font-semibold text-slate-500">
        {[1, 2, 3, 4].map((item) => (
          <li
            key={item}
            className={`rounded-full px-3 py-1 ${step === item ? 'bg-teal-700 text-white' : 'bg-slate-100'}`}
          >
            Paso {item}
          </li>
        ))}
      </ol>

      {availabilityLoading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-600" aria-busy="true">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando disponibilidad…
        </p>
      ) : null}

      {availabilityError ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {availabilityError}
        </p>
      ) : null}

      {step === 1 ? (
        <section className="mt-6 space-y-3" data-testid="booking-step-1">
          <h2 className="text-lg font-semibold text-slate-900">Tus datos</h2>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Nombre *"
            value={lead.firstName}
            onChange={(e) => patchLead({ firstName: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Apellidos"
            value={lead.lastName}
            onChange={(e) => patchLead({ lastName: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Email *"
            type="email"
            value={lead.email}
            onChange={(e) => patchLead({ email: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="País *"
            value={lead.country}
            onChange={(e) => patchLead({ country: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Ciudad *"
            value={lead.city}
            onChange={(e) => patchLead({ city: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="WhatsApp (opcional)"
            value={lead.whatsapp}
            onChange={(e) => patchLead({ whatsapp: e.target.value })}
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            value={lead.sessionReason}
            onChange={(e) => patchLead({ sessionReason: e.target.value })}
          >
            {SESSION_REASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-3"
            value={lead.objective}
            onChange={(e) => patchLead({ objective: e.target.value })}
          >
            {SESSION_OBJECTIVE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-3"
            placeholder="Mensaje *"
            maxLength={500}
            value={lead.message}
            onChange={(e) => patchLead({ message: e.target.value })}
          />
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={lead.privacyAccepted}
              onChange={(e) => patchLead({ privacyAccepted: e.target.checked })}
            />
            Acepto el tratamiento de mis datos para gestionar esta reserva.
          </label>
          <button
            type="button"
            className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white"
            onClick={() => {
              const error = validateStep1()
              if (error) {
                setSubmitError(error)
                return
              }
              setSubmitError('')
              setStep(2)
            }}
          >
            Continuar
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-6 space-y-3" data-testid="booking-step-2">
          <h2 className="text-lg font-semibold text-slate-900">Elige una fecha</h2>
          {!availabilityLoading && dateKeys.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No hay fechas disponibles en los próximos 31 días.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dateKeys.map((dateKey) => (
                <button
                  key={dateKey}
                  type="button"
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    selectedDate === dateKey
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                  onClick={() => {
                    setSelectedDate(dateKey)
                    setSelectedTime('')
                  }}
                >
                  {dateKey}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className="rounded-xl border px-4 py-3" onClick={() => setStep(1)}>
              Atrás
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              disabled={!selectedDate}
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-6 space-y-3" data-testid="booking-step-3">
          <h2 className="text-lg font-semibold text-slate-900">Elige una hora</h2>
          <p className="text-sm text-slate-600">{selectedDate}</p>
          {timesForDate.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No hay horas disponibles para este día.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timesForDate.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                    selectedTime === time
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className="rounded-xl border px-4 py-3" onClick={() => setStep(2)}>
              Atrás
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
              disabled={!selectedTime || submitting}
              aria-busy={submitting}
              onClick={() => void confirmBooking()}
            >
              {submitting ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 && confirmation ? (
        <section className="mt-6 space-y-3" data-testid="booking-step-4">
          <h2 className="text-lg font-semibold text-slate-900">Reserva confirmada</h2>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-5 text-sm text-slate-800">
            <p>
              <strong>{confirmation.professionalName}</strong>
            </p>
            <p className="mt-2">
              {confirmation.date} · {confirmation.time} ({confirmation.timezone})
            </p>
            <p className="mt-1">{confirmation.duration} minutos</p>
          </div>
        </section>
      ) : null}

      {submitError ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {submitError}
        </p>
      ) : null}
    </main>
  )
}
