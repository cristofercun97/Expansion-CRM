import { Eye } from 'lucide-react'
import { Button } from '@/components/ui'
import { ContactStatusSelect } from '@/features/contacts/components/ContactStatusSelect'
import { ContactWhatsappButton } from '@/features/contacts/components/ContactWhatsappButton'
import type { Contact, ContactStatus } from '@/features/contacts/types/contact.types'
import { formatContactDate } from '@/features/contacts/utils/formatContactDate'

type ContactsListProps = {
  contacts: Contact[]
  updatingContactId?: string | null
  onStatusChange: (contactId: string, status: ContactStatus) => void
  onViewDetail: (contact: Contact) => void
}

function ContactActions({
  contact,
  onViewDetail,
}: {
  contact: Contact
  onViewDetail: (contact: Contact) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ContactWhatsappButton whatsapp={contact.whatsapp} />
      <Button type="button" variant="outline" size="sm" onClick={() => onViewDetail(contact)}>
        <Eye className="h-4 w-4" aria-hidden="true" />
        Ver detalle
      </Button>
    </div>
  )
}

function ContactCard({
  contact,
  updatingContactId,
  onStatusChange,
  onViewDetail,
}: {
  contact: Contact
  updatingContactId?: string | null
  onStatusChange: (contactId: string, status: ContactStatus) => void
  onViewDetail: (contact: Contact) => void
}) {
  return (
    <article className="rounded-xl border border-petrol-dark/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-dark">
            {contact.name || 'Sin nombre'}
          </h3>
          <p className="mt-1 text-sm text-text-soft">{contact.whatsapp || '—'}</p>
        </div>
      </div>

      <div className="mt-4">
        <ContactActions contact={contact} onViewDetail={onViewDetail} />
      </div>

      <div className="mt-4">
        <label
          htmlFor={`contact-status-${contact.id}`}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-soft"
        >
          Estado
        </label>
        <ContactStatusSelect
          contactId={contact.id}
          value={contact.status}
          isUpdating={updatingContactId === contact.id}
          onChange={onStatusChange}
          className="w-full"
        />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-text-soft">Interés</dt>
          <dd className="font-medium text-text-dark">{contact.interest || '—'}</dd>
        </div>
        <div>
          <dt className="text-text-soft">Fecha</dt>
          <dd className="font-medium text-text-dark">{formatContactDate(contact.createdAt)}</dd>
        </div>
        {contact.landingSlug ? (
          <div>
            <dt className="text-text-soft">Presentación</dt>
            <dd className="font-medium text-text-dark">{contact.landingSlug}</dd>
          </div>
        ) : null}
        {contact.message ? (
          <div>
            <dt className="text-text-soft">Mensaje</dt>
            <dd className="line-clamp-2 text-text-dark">{contact.message}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}

export function ContactsList({
  contacts,
  updatingContactId,
  onStatusChange,
  onViewDetail,
}: ContactsListProps) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            updatingContactId={updatingContactId}
            onStatusChange={onStatusChange}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-petrol-dark/10 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-petrol-dark/10">
          <thead className="bg-bg-warm/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                WhatsApp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                Interés
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-soft">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-petrol-dark/10">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-bg-warm/30">
                <td className="px-4 py-3 text-sm font-medium text-text-dark">
                  {contact.name || 'Sin nombre'}
                </td>
                <td className="px-4 py-3 text-sm text-text-soft">{contact.whatsapp || '—'}</td>
                <td className="px-4 py-3 text-sm text-text-dark">{contact.interest || '—'}</td>
                <td className="px-4 py-3">
                  <ContactStatusSelect
                    contactId={contact.id}
                    value={contact.status}
                    isUpdating={updatingContactId === contact.id}
                    onChange={onStatusChange}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-text-soft">
                  {formatContactDate(contact.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <ContactActions contact={contact} onViewDetail={onViewDetail} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
