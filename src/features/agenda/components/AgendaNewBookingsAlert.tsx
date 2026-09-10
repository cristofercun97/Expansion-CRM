import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOptionalNotificationsContext } from '@/features/notifications/hooks/useNotificationsContext'
import {
  contactActionUrl,
  meetingActionUrl,
  resolveBookingAlertFields,
  selectUnreadPublicBookings,
} from '@/features/notifications/utils/bookingNotificationBadge'
import { formatLongDate } from '@/features/presentation/utils/publicBookingUiUtils'

function formatAlertDate(dateLabel: string): string {
  if (!dateLabel) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateLabel)) {
    try {
      return formatLongDate(dateLabel)
    } catch {
      return dateLabel
    }
  }
  return dateLabel
}

export function AgendaNewBookingsAlert() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const notifications = useOptionalNotificationsContext()
  const [expanded, setExpanded] = useState(false)
  const uid = currentUser?.uid?.trim() || ''

  if (!uid || !notifications) return null

  const preview = selectUnreadPublicBookings(
    notifications.notifications,
    expanded ? 99 : 3,
  )
  if (preview.total === 0) return null

  async function markAndGo(notificationId: string, url: string) {
    try {
      await notifications!.markRead(notificationId)
    } catch {
      // navigation still proceeds
    }
    navigate(url)
  }

  return (
    <section
      className="mb-4 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 via-white/5 to-teal-accent/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      data-testid="agenda-new-bookings-alert"
      aria-label="Nuevas reservas"
    >
      <header className="mb-3">
        <p className="text-sm font-semibold text-gold-light">
          {preview.total === 1
            ? '✨ Tienes una nueva reserva'
            : `✨ Nuevas reservas (${preview.total})`}
        </p>
        <p className="mt-0.5 text-xs text-hero-text/65">
          Reservas confirmadas desde tu presentación / encuentro gratuito.
        </p>
      </header>

      <ul className="space-y-3">
        {preview.items.map((item) => {
          const fields = resolveBookingAlertFields(item)
          const dateText = formatAlertDate(fields.dateLabel)
          const when =
            dateText && fields.timeLabel
              ? `${dateText} · ${fields.timeLabel}`
              : dateText || fields.timeLabel || 'Horario por confirmar'
          const duration =
            fields.durationMinutes != null ? ` · ${fields.durationMinutes} min` : ''

          return (
            <li
              key={item.id}
              className="rounded-xl border border-white/10 bg-petrol-deep/40 p-3"
              data-testid="agenda-new-booking-item"
            >
              <p className="text-sm font-semibold text-hero-text">{fields.leadName}</p>
              <p className="mt-0.5 text-xs text-hero-text/70">
                ha reservado un encuentro contigo.
              </p>
              <p className="mt-1 text-xs text-hero-text/80">
                {when}
                {duration}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gold-light/80">
                Presentación / Encuentro gratuito
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fields.meetingId ? (
                  <button
                    type="button"
                    className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-petrol-deep transition hover:bg-gold-light"
                    onClick={() => void markAndGo(item.id, meetingActionUrl(fields.meetingId!))}
                  >
                    Ver cita
                  </button>
                ) : null}
                {fields.contactId ? (
                  <button
                    type="button"
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-hero-text transition hover:bg-white/10"
                    onClick={() => void markAndGo(item.id, contactActionUrl(fields.contactId!))}
                  >
                    Ver contacto
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-hero-text/70 underline-offset-2 hover:text-hero-text hover:underline"
                  onClick={() => void notifications!.markRead(item.id)}
                >
                  Marcar como vista
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {preview.hasMore && !expanded ? (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-gold-light underline-offset-2 hover:underline"
          onClick={() => setExpanded(true)}
          data-testid="agenda-new-bookings-see-all"
        >
          Ver todas ({preview.total})
        </button>
      ) : null}
    </section>
  )
}
