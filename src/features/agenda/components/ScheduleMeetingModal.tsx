import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import type { Contact } from '@/features/contacts/types/contact.types'
import type {
  GoogleCalendarConnectionStatus,
  Meeting,
  MeetingFormValues,
  MeetingParticipant,
} from '@/features/agenda/types/meeting.types'
import {
  buildMeetingFormValues,
  toCreateMeetingInput,
  toUpdateMeetingInput,
  validateMeetingForm,
} from '@/features/agenda/utils/meetingForm'
import {
  MEETING_DURATION_OPTIONS,
  MEETING_MODE_OPTIONS,
  MEETING_TYPE_OPTIONS,
} from '@/features/agenda/utils/meetingLabels'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import { googleCalendarFunctionsService } from '@/features/agenda/services/google-calendar-functions.service'
import { teamService } from '@/features/team/services/team.service'
import type { TeamMember } from '@/features/team/types/team.types'

type InternalMemberOption = {
  userId: string
  name: string
  email?: string
}

type ScheduleMeetingModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  organizerId: string
  organizerName: string
  contacts: Contact[]
  googleStatus: GoogleCalendarConnectionStatus
  meeting?: Meeting | null
  preselectedContactId?: string
  onClose: () => void
  onSaved: (meeting: Meeting) => void
}

export function ScheduleMeetingModal({
  open,
  mode,
  organizerId,
  organizerName,
  contacts,
  googleStatus,
  meeting,
  preselectedContactId,
  onClose,
  onSaved,
}: ScheduleMeetingModalProps) {
  const [values, setValues] = useState<MeetingFormValues>(() =>
    buildMeetingFormValues({
      mode,
      meeting,
      contacts,
      preselectedContactId,
      preferGoogleMeetDefault: googleStatus.connected,
    }),
  )
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof validateMeetingForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [externalName, setExternalName] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [contactQuery, setContactQuery] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [internalMembers, setInternalMembers] = useState<InternalMemberOption[]>([])

  useEffect(() => {
    if (!open) {
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
  }, [onClose, open])

  useEffect(() => {
    if (!open || !organizerId) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const team = await teamService.getMyTeam(organizerId)
        if (!team || cancelled) {
          if (!cancelled) {
            setInternalMembers([])
          }
          return
        }

        const members = await teamService.getTeamMembersByTeamId(team.id, organizerId)
        if (cancelled) {
          return
        }

        const options: InternalMemberOption[] = members
          .filter((member: TeamMember) => member.status === 'active' && member.memberUid !== organizerId)
          .map((member: TeamMember) => ({
            userId: member.memberUid,
            name: member.memberName?.trim() || member.memberEmail?.trim() || 'Miembro',
            email: member.memberEmail?.trim() || undefined,
          }))

        setInternalMembers(options)
      } catch {
        if (!cancelled) {
          setInternalMembers([])
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, organizerId])

  const filteredContacts = useMemo(() => {
    const query = contactQuery.trim().toLowerCase()
    if (!query) {
      return contacts.slice(0, 8)
    }

    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.whatsapp.toLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [contactQuery, contacts])

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase()
    const available = internalMembers.filter(
      (member) => !values.participants.some((item) => item.userId === member.userId),
    )
    if (!query) {
      return available.slice(0, 8)
    }

    return available
      .filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          (member.email?.toLowerCase().includes(query) ?? false),
      )
      .slice(0, 8)
  }, [internalMembers, memberQuery, values.participants])

  const contactsWithoutEmail = useMemo(
    () =>
      values.participants.filter(
        (participant) => participant.type === 'contact' && !participant.email?.trim(),
      ),
    [values.participants],
  )

  function updateField<K extends keyof MeetingFormValues>(key: K, value: MeetingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function addContactParticipant(contact: Contact) {
    setValues((current) => {
      if (current.participants.some((item) => item.contactId === contact.id)) {
        return current
      }

      const participant: MeetingParticipant = {
        type: 'contact',
        contactId: contact.id,
        name: contact.name,
      }

      return {
        ...current,
        contactId: current.contactId || contact.id,
        participants: [...current.participants, participant],
        title: current.title.trim() ? current.title : `Seguimiento con ${contact.name}`,
      }
    })
  }

  function addInternalParticipant(member: InternalMemberOption) {
    setValues((current) => {
      if (current.participants.some((item) => item.userId === member.userId)) {
        return current
      }

      if (
        member.email &&
        current.participants.some((item) => item.email?.trim().toLowerCase() === member.email?.toLowerCase())
      ) {
        return current
      }

      const participant: MeetingParticipant = {
        type: 'user',
        userId: member.userId,
        name: member.name,
        email: member.email,
      }

      return {
        ...current,
        participants: [...current.participants, participant],
      }
    })
  }

  function addExternalParticipant() {
    const name = externalName.trim()
    const email = externalEmail.trim().toLowerCase()
    if (!name || !email) {
      setErrors((current) => ({
        ...current,
        form: 'Nombre y email son obligatorios para invitados externos.',
      }))
      return
    }

    setValues((current) => {
      if (current.participants.some((item) => item.email?.trim().toLowerCase() === email)) {
        return current
      }

      return {
        ...current,
        participants: [
          ...current.participants,
          {
            type: 'external',
            name,
            email,
          },
        ],
      }
    })
    setExternalName('')
    setExternalEmail('')
    setErrors((current) => ({ ...current, form: undefined }))
  }

  function removeParticipant(index: number) {
    setValues((current) => ({
      ...current,
      participants: current.participants.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validateMeetingForm(values)
    if (
      values.meetingMode === 'video' &&
      values.videoLinkMethod === 'google_meet' &&
      !googleStatus.connected
    ) {
      nextErrors.form =
        'Conecta Google o elige un enlace manual para continuar con la videollamada.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'edit' && meeting) {
        const syncGoogle =
          values.meetingMode === 'video' &&
          values.videoLinkMethod === 'google_meet' &&
          Boolean(meeting.googleCalendarEventId)
        const updated = await meetingsService.updateMeeting(
          meeting.id,
          organizerId,
          toUpdateMeetingInput(values, syncGoogle, organizerName),
        )
        onSaved(updated)
      } else {
        const created = await meetingsService.createMeeting(
          organizerId,
          toCreateMeetingInput(values, organizerName),
        )
        onSaved(created)
      }
      onClose()
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'No pudimos guardar la reunión.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar formulario"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-meeting-title"
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="schedule-meeting-title" className="text-xl font-semibold text-text-dark">
              {mode === 'edit' ? 'Editar reunión' : 'Nueva reunión'}
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              Convierte un contacto en una acción concreta con fecha y seguimiento.
            </p>
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

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-title">
              Título
            </label>
            <Input
              id="meeting-title"
              value={values.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Seguimiento con María"
            />
            {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-type">
                Categoría
              </label>
              <select
                id="meeting-type"
                value={values.type}
                onChange={(event) =>
                  updateField('type', event.target.value as MeetingFormValues['type'])
                }
                className="h-11 w-full rounded-xl border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark"
              >
                {MEETING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-text-dark"
                htmlFor="meeting-duration"
              >
                Duración
              </label>
              <select
                id="meeting-duration"
                value={values.durationMinutes}
                onChange={(event) => updateField('durationMinutes', Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark"
              >
                {MEETING_DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutos
                  </option>
                ))}
                <option value={0}>Personalizada</option>
              </select>
              {values.durationMinutes === 0 ? (
                <Input
                  className="mt-2"
                  type="number"
                  min={5}
                  max={480}
                  value={values.customDurationMinutes}
                  onChange={(event) => updateField('customDurationMinutes', event.target.value)}
                  placeholder="Minutos"
                />
              ) : null}
              {errors.customDurationMinutes ? (
                <p className="mt-1 text-xs text-red-600">{errors.customDurationMinutes}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-date">
                Fecha
              </label>
              <Input
                id="meeting-date"
                type="date"
                value={values.date}
                onChange={(event) => updateField('date', event.target.value)}
              />
              {errors.date ? <p className="mt-1 text-xs text-red-600">{errors.date}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-time">
                Hora
              </label>
              <Input
                id="meeting-time"
                type="time"
                value={values.time}
                onChange={(event) => updateField('time', event.target.value)}
              />
              {errors.time ? <p className="mt-1 text-xs text-red-600">{errors.time}</p> : null}
            </div>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-text-dark"
              htmlFor="meeting-description"
            >
              Descripción / objetivo
            </label>
            <Textarea
              id="meeting-description"
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Revisar avances de captación y acordar próximos pasos."
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-notes">
              Notas previas
            </label>
            <Textarea
              id="meeting-notes"
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-xl border border-petrol-dark/10 p-3">
            <p className="text-sm font-medium text-text-dark">Participantes y contacto</p>
            <Input
              className="mt-2"
              value={contactQuery}
              onChange={(event) => setContactQuery(event.target.value)}
              placeholder="Buscar contacto..."
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => addContactParticipant(contact)}
                  className="rounded-full border border-petrol-dark/15 px-3 py-1 text-xs text-text-dark hover:bg-petrol-dark/5"
                >
                  {contact.name}
                </button>
              ))}
            </div>

            {internalMembers.length > 0 ? (
              <>
                <Input
                  className="mt-3"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Buscar miembro interno..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => addInternalParticipant(member)}
                      className="rounded-full border border-teal-600/30 bg-teal-50 px-3 py-1 text-xs text-teal-900 hover:bg-teal-100"
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {values.meetingMode === 'video' &&
            values.videoLinkMethod === 'google_meet' &&
            contactsWithoutEmail.length > 0 ? (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {contactsWithoutEmail.length === 1
                  ? `Este contacto (${contactsWithoutEmail[0]?.name}) no tiene email registrado y no recibirá la invitación de Google Calendar.`
                  : 'Algunos contactos no tienen email registrado y no recibirán la invitación de Google Calendar.'}{' '}
                Los participantes con email sí se enviarán a Calendar.
              </p>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={externalName}
                onChange={(event) => setExternalName(event.target.value)}
                placeholder="Nombre invitado"
              />
              <Input
                type="email"
                value={externalEmail}
                onChange={(event) => setExternalEmail(event.target.value)}
                placeholder="email@ejemplo.com"
              />
              <Button type="button" variant="outline" onClick={addExternalParticipant}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Externo
              </Button>
            </div>

            <ul className="mt-3 space-y-2">
              {values.participants.map((participant, index) => (
                <li
                  key={`${participant.type}-${participant.email ?? participant.contactId ?? participant.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-petrol-dark/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-text-dark">{participant.name}</p>
                    <p className="text-xs text-text-soft">
                      {participant.type}
                      {participant.email ? ` · ${participant.email}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => removeParticipant(index)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-petrol-dark/10 p-3 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dark" htmlFor="meeting-mode">
                Tipo de reunión
              </label>
              <select
                id="meeting-mode"
                value={values.meetingMode}
                onChange={(event) =>
                  updateField('meetingMode', event.target.value as MeetingFormValues['meetingMode'])
                }
                className="h-11 w-full rounded-xl border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark"
              >
                {MEETING_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {values.meetingMode === 'video' ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-dark">¿Cómo quieres realizarla?</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-3 rounded-lg border border-petrol-dark/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={values.videoLinkMethod === 'manual'}
                      onChange={() => updateField('videoLinkMethod', 'manual')}
                    />
                    <span>
                      <span className="font-medium text-text-dark">Añadir enlace manual</span>
                      <span className="mt-0.5 block text-text-soft">
                        Pega un enlace HTTPS (Meet, Zoom, Teams u otro).
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-petrol-dark/10 px-3 py-2 text-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={values.videoLinkMethod === 'google_meet'}
                      onChange={() => updateField('videoLinkMethod', 'google_meet')}
                    />
                    <span>
                      <span className="font-medium text-text-dark">Crear Google Meet automáticamente</span>
                      <span className="mt-0.5 block text-text-soft">
                        Usa tu cuenta Google conectada (opcional).
                      </span>
                    </span>
                  </label>
                </div>

                {values.videoLinkMethod === 'manual' ? (
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-medium text-text-dark"
                      htmlFor="meeting-url"
                    >
                      Enlace de videollamada
                    </label>
                    <Input
                      id="meeting-url"
                      type="url"
                      value={values.meetingUrl}
                      onChange={(event) => updateField('meetingUrl', event.target.value)}
                      placeholder="https://meet.google.com/..."
                    />
                    {errors.meetingUrl ? (
                      <p className="mt-1 text-xs text-red-600">{errors.meetingUrl}</p>
                    ) : null}
                  </div>
                ) : null}

                {values.videoLinkMethod === 'google_meet' && !googleStatus.connected ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-2">
                    <p>Conecta tu cuenta de Google para crear automáticamente el enlace de Meet.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={connectingGoogle || !googleStatus.configured}
                        onClick={() => {
                          setConnectingGoogle(true)
                          void googleCalendarFunctionsService
                            .getConnectUrl()
                            .then((url) => {
                              window.location.assign(url)
                            })
                            .catch(() => {
                              setConnectingGoogle(false)
                              setErrors((current) => ({
                                ...current,
                                form: 'No pudimos iniciar la conexión con Google.',
                              }))
                            })
                        }}
                      >
                        Conectar Google
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateField('videoLinkMethod', 'manual')}
                      >
                        Usar enlace manual
                      </Button>
                    </div>
                  </div>
                ) : null}

                {values.videoLinkMethod === 'google_meet' && googleStatus.connected ? (
                  <p className="text-xs text-text-soft">
                    Se creará el evento en tu Google Calendar y se generará el enlace Meet.
                  </p>
                ) : null}
              </div>
            ) : null}

            {values.meetingMode === 'in_person' ? (
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-text-dark"
                  htmlFor="meeting-location"
                >
                  Ubicación (opcional)
                </label>
                <Input
                  id="meeting-location"
                  value={values.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Oficina, café, dirección..."
                />
              </div>
            ) : null}
          </div>

          {errors.form ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.form}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : mode === 'edit' ? (
                'Guardar cambios'
              ) : (
                'Crear reunión'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
