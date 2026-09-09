import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ContactWhatsappButton } from '@/features/contacts/components/ContactWhatsappButton'
import type { Contact } from '@/features/contacts/types/contact.types'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { getContactSourceLabel } from '@/features/contacts/utils/contactSourceLabels'
import { getContactStatusLabel } from '@/features/contacts/utils/contactStatusLabels'
import { leadActivitiesService } from '@/services/lead-activities.service'
import type { LeadActivity } from '@/types'

type ContactDetailModalProps = {
  contact: Contact | null
  onClose: () => void
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-soft">{label}</dt>
      <dd className="mt-1 text-sm text-text-dark">{value || '—'}</dd>
    </div>
  )
}

function activityTitle(activity: LeadActivity): string {
  switch (activity.eventKind) {
    case 'meeting_scheduled':
      return 'Reunión agendada'
    case 'meeting_rescheduled':
      return 'Reunión reprogramada'
    case 'meeting_completed':
      return 'Reunión realizada'
    case 'meeting_no_show':
      return 'No asistió'
    case 'meeting_cancelled':
      return 'Reunión cancelada'
    case 'next_action_created':
      return 'Próxima acción'
    default:
      if (activity.type === 'meeting') return 'Reunión'
      if (activity.type === 'task') return 'Acción'
      return 'Actividad'
  }
}

export function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [timelineContactId, setTimelineContactId] = useState<string | null>(null)

  if (contact?.id && contact.id !== timelineContactId) {
    setTimelineContactId(contact.id)
    setActivities([])
    setActivitiesLoading(true)
  }
  if (!contact && timelineContactId) {
    setTimelineContactId(null)
    setActivities([])
    setActivitiesLoading(false)
  }

  useEffect(() => {
    if (!contact) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [contact, onClose])

  useEffect(() => {
    if (!contact?.id) {
      return
    }
    const contactId = contact.id
    let cancelled = false
    void leadActivitiesService
      .getLeadActivitiesByProspectId(contactId)
      .then((items) => {
        if (!cancelled) setActivities(items)
      })
      .catch(() => {
        if (!cancelled) setActivities([])
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contact?.id])

  if (!contact) {
    return null
  }

  const contactId = contact.id

  function handleScheduleMeeting() {
    onClose()
    navigate(`/dashboard/agenda?contactId=${encodeURIComponent(contactId)}&action=schedule`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-detail-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-detail-title" className="text-xl font-semibold text-text-dark">
              {contact.name || 'Sin nombre'}
            </h2>
            <p className="mt-1 text-sm text-text-soft">Detalle del contacto</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-soft transition-colors hover:bg-petrol-dark/5 hover:text-text-dark"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-6 space-y-4">
          <DetailField label="Nombre" value={contact.name} />
          <DetailField label="WhatsApp" value={contact.whatsapp} />
          <DetailField label="Interés" value={contact.interest} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-soft">Mensaje</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-text-dark">
              {contact.message || '—'}
            </dd>
          </div>
          <DetailField label="Estado" value={getContactStatusLabel(contact.status)} />
          <DetailField label="Landing" value={contact.landingSlug} />
          <DetailField label="Fuente" value={getContactSourceLabel(contact.source)} />
          <DetailField label="Fecha de creación" value={formatContactDateTime(contact.createdAt)} />
          <DetailField
            label="Fecha de actualización"
            value={formatContactDateTime(contact.updatedAt)}
          />
        </dl>

        <section className="mt-6 border-t border-petrol-dark/10 pt-5">
          <h3 className="text-sm font-semibold text-text-dark">Actividad / Historial</h3>
          {activitiesLoading ? (
            <p className="mt-3 text-sm text-text-soft">Cargando historial…</p>
          ) : activities.length === 0 ? (
            <p className="mt-3 text-sm text-text-soft">Sin actividad registrada todavía.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-xl border border-petrol-dark/10 bg-petrol-dark/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-text-dark">{activityTitle(activity)}</p>
                  <p className="mt-0.5 text-xs text-text-soft">
                    {formatContactDateTime(activity.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-text-dark/80">{activity.description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <ContactWhatsappButton whatsapp={contact.whatsapp} size="md" />
          <Button type="button" onClick={handleScheduleMeeting}>
            Agendar reunión
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
