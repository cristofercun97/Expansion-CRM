import { Loader2, UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { ContactDetailModal } from '@/features/contacts/components/ContactDetailModal'
import { ContactsFilters } from '@/features/contacts/components/ContactsFilters'
import { ContactsKpiGrid } from '@/features/contacts/components/ContactsKpiGrid'
import { ContactsList } from '@/features/contacts/components/ContactsList'
import { CreateContactModal } from '@/features/contacts/components/CreateContactModal'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact, ContactStatus } from '@/features/contacts/types/contact.types'
import {
  DEFAULT_CONTACT_FILTERS,
  filterContacts,
  hasActiveContactFilters,
  type ContactFiltersState,
} from '@/features/contacts/utils/contactFilters'
import { sortContactsByCreatedAtDesc } from '@/features/contacts/utils/contactMappers'
import {
  buildManualContactInput,
  type ManualContactFormValues,
} from '@/features/contacts/utils/manualContactForm'
import { useAuth } from '@/features/auth/hooks/useAuth'

function logContactsDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function ContactsPage() {
  const { currentUser, initialized, loading: authLoading } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filters, setFilters] = useState<ContactFiltersState>(DEFAULT_CONTACT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingContact, setIsCreatingContact] = useState(false)

  const uid = currentUser?.uid

  const filteredContacts = useMemo(
    () => filterContacts(contacts, filters),
    [contacts, filters],
  )

  const loadContacts = useCallback(async (ownerUid: string) => {
    setLoading(true)
    setError('')

    try {
      const results = await contactsService.getContactsByOwner(ownerUid)
      setContacts(results)
    } catch (loadError) {
      logContactsDevError('[Contactos] Error al cargar contactos', loadError)
      setContacts([])
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tus contactos. Intenta nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    if (!uid) {
      setLoading(false)
      return
    }

    void loadContacts(uid)
  }, [authLoading, initialized, loadContacts, uid])

  const handleStatusChange = useCallback(async (contactId: string, status: ContactStatus) => {
    let previousStatus: ContactStatus | null = null

    setContacts((currentContacts) => {
      const previousContact = currentContacts.find((contact) => contact.id === contactId)

      if (!previousContact || previousContact.status === status) {
        return currentContacts
      }

      previousStatus = previousContact.status

      return currentContacts.map((contact) =>
        contact.id === contactId ? { ...contact, status } : contact,
      )
    })

    if (previousStatus === null) {
      return
    }

    setUpdatingContactId(contactId)
    setStatusError('')

    try {
      await contactsService.updateContactStatus(contactId, status)
    } catch (updateError) {
      logContactsDevError('[Contactos] Error al actualizar estado', updateError)
      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === contactId ? { ...contact, status: previousStatus as ContactStatus } : contact,
        ),
      )
      setStatusError(
        updateError instanceof Error
          ? updateError.message
          : 'No pudimos actualizar el estado. Intenta nuevamente.',
      )
    } finally {
      setUpdatingContactId(null)
    }
  }, [])

  const handleCreateContact = useCallback(
    async (values: ManualContactFormValues) => {
      if (!uid) {
        throw new Error('Debes iniciar sesión para agregar contactos.')
      }

      setIsCreatingContact(true)
      setCreateSuccess('')

      try {
        const createdContact = await contactsService.createManualContact(
          uid,
          buildManualContactInput(values),
        )

        setContacts((currentContacts) =>
          sortContactsByCreatedAtDesc([createdContact, ...currentContacts]),
        )
        setIsCreateModalOpen(false)
        setCreateSuccess('Contacto agregado correctamente.')
      } catch (createError) {
        logContactsDevError('[Contactos] Error al crear contacto', createError)
        throw createError instanceof Error
          ? createError
          : new Error('No pudimos agregar el contacto. Intenta nuevamente.')
      } finally {
        setIsCreatingContact(false)
      }
    },
    [uid],
  )

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver tus contactos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader
        title="Contactos"
        subtitle="Gestiona las personas que dejaron sus datos en tus presentaciones."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        actions={
          !loading && !error ? (
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Agregar contacto
            </Button>
          ) : null
        }
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando contactos...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <>
          {createSuccess ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {createSuccess}
            </div>
          ) : null}

          {contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no tienes contactos"
              description="Comparte tu presentación o agrega manualmente tu primer contacto."
              className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
            />
          ) : (
            <>
              <ContactsKpiGrid contacts={contacts} />
              <ContactsFilters contacts={contacts} filters={filters} onChange={setFilters} />

              {statusError ? (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {statusError}
                </div>
              ) : null}

              {filteredContacts.length === 0 ? (
                <div className="rounded-xl border border-white/15 bg-white/8 px-4 py-8 text-center text-sm text-hero-text/75 backdrop-blur-xl">
                  No encontramos contactos con estos filtros.
                </div>
              ) : (
                <ContactsList
                  contacts={filteredContacts}
                  updatingContactId={updatingContactId}
                  onStatusChange={handleStatusChange}
                  onViewDetail={setSelectedContact}
                />
              )}

              {hasActiveContactFilters(filters) && filteredContacts.length > 0 ? (
                <p className="text-sm text-hero-text/60">
                  Mostrando {filteredContacts.length} de {contacts.length} contactos
                </p>
              ) : null}
            </>
          )}

          <ContactDetailModal contact={selectedContact} onClose={() => setSelectedContact(null)} />
          <CreateContactModal
            open={isCreateModalOpen}
            isSubmitting={isCreatingContact}
            onClose={() => {
              if (!isCreatingContact) {
                setIsCreateModalOpen(false)
              }
            }}
            onSubmit={handleCreateContact}
          />
        </>
      )}
    </div>
  )
}
