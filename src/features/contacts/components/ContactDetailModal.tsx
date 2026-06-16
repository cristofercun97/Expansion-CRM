import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { ContactWhatsappButton } from '@/features/contacts/components/ContactWhatsappButton'
import type { Contact } from '@/features/contacts/types/contact.types'
import {
  formatContactDateTime,
} from '@/features/contacts/utils/formatContactDate'
import { getContactSourceLabel } from '@/features/contacts/utils/contactSourceLabels'
import { getContactStatusLabel } from '@/features/contacts/utils/contactStatusLabels'

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

export function ContactDetailModal({ contact, onClose }: ContactDetailModalProps) {
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

  if (!contact) {
    return null
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
          <DetailField label="Fecha de actualización" value={formatContactDateTime(contact.updatedAt)} />
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <ContactWhatsappButton whatsapp={contact.whatsapp} size="md" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
