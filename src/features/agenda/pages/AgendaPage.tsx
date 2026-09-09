import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Loader2, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { GoogleCalendarStatusCard } from '@/features/agenda/components/GoogleCalendarStatusCard'
import { MeetingCard } from '@/features/agenda/components/MeetingCard'
import { MeetingDetailModal } from '@/features/agenda/components/MeetingDetailModal'
import { CreateMeetingNextActionModal } from '@/features/agenda/components/CreateMeetingNextActionModal'
import { RecordMeetingResultModal } from '@/features/agenda/components/RecordMeetingResultModal'
import { RescheduleMeetingModal } from '@/features/agenda/components/RescheduleMeetingModal'
import { ScheduleMeetingModal } from '@/features/agenda/components/ScheduleMeetingModal'
import { useMeetings } from '@/features/agenda/hooks/useMeetings'
import type {
  AgendaStatusFilter,
  AgendaViewMode,
  GoogleCalendarConnectionStatus,
  Meeting,
} from '@/features/agenda/types/meeting.types'
import {
  addDays,
  endOfDay,
  getMonthCalendarDays,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  timestampToDate,
} from '@/features/agenda/utils/meetingDateUtils'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact } from '@/features/contacts/types/contact.types'
import { cn } from '@/lib/utils'

const FILTERS: Array<{ id: AgendaStatusFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoy' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'completed', label: 'Realizadas' },
  { id: 'cancelled', label: 'Canceladas' },
]

export function AgendaPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { meetings, loading, error, reload, organizerId, currentUserId, isAdmin, organizerName } =
    useMeetings()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filter, setFilter] = useState<AgendaStatusFilter>('upcoming')
  const [viewMode, setViewMode] = useState<AgendaViewMode>('list')
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'create' | 'edit'>('create')
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [rescheduleMeeting, setRescheduleMeeting] = useState<Meeting | null>(null)
  const [resultMeeting, setResultMeeting] = useState<Meeting | null>(null)
  const [nextActionMeeting, setNextActionMeeting] = useState<Meeting | null>(null)
  const [preselectedContactId, setPreselectedContactId] = useState<string | undefined>()
  const [scheduleSession, setScheduleSession] = useState(0)
  const [consumedScheduleQuery, setConsumedScheduleQuery] = useState('')
  const [consumedMeetingDeepLink, setConsumedMeetingDeepLink] = useState('')
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarConnectionStatus>({
    connected: false,
    email: null,
    configured: false,
  })

  const handleGoogleStatusChange = useCallback((status: GoogleCalendarConnectionStatus) => {
    setGoogleStatus(status)
  }, [])

  const scheduleQueryContactId = searchParams.get('contactId')?.trim() ?? ''
  const scheduleQueryAction = searchParams.get('action')?.trim() ?? ''
  const scheduleQueryKey =
    scheduleQueryAction === 'schedule' && scheduleQueryContactId
      ? `${scheduleQueryContactId}:${scheduleQueryAction}`
      : ''
  const meetingDeepLinkId = searchParams.get('meetingId')?.trim() ?? ''

  if (scheduleQueryKey && scheduleQueryKey !== consumedScheduleQuery) {
    setConsumedScheduleQuery(scheduleQueryKey)
    setPreselectedContactId(scheduleQueryContactId)
    setScheduleMode('create')
    setEditingMeeting(null)
    setScheduleSession((value) => value + 1)
    setScheduleOpen(true)
  }

  if (
    meetingDeepLinkId &&
    meetingDeepLinkId !== consumedMeetingDeepLink &&
    !loading &&
    meetings.length > 0
  ) {
    const found = meetings.find((item) => item.id === meetingDeepLinkId)
    if (found) {
      setConsumedMeetingDeepLink(meetingDeepLinkId)
      setSelectedMeeting(found)
    }
  }

  useEffect(() => {
    if (!meetingDeepLinkId || meetingDeepLinkId !== consumedMeetingDeepLink) {
      return
    }
    const next = new URLSearchParams(searchParams)
    if (!next.has('meetingId')) {
      return
    }
    next.delete('meetingId')
    setSearchParams(next, { replace: true })
  }, [meetingDeepLinkId, consumedMeetingDeepLink, searchParams, setSearchParams])

  useEffect(() => {
    if (!organizerId) {
      return
    }

    void contactsService.getContactsByOwner(organizerId).then(setContacts).catch(() => {
      setContacts([])
    })
  }, [organizerId])

  useEffect(() => {
    const googleParam = searchParams.get('googleCalendar')
    if (!googleParam) {
      return
    }

    if (googleParam === 'connected') {
      showToast('Google Calendar conectado correctamente.', 'success')
    } else if (googleParam === 'missing_refresh') {
      showToast(
        'Google no devolvió permiso de acceso continuo. Vuelve a conectar y acepta todos los permisos.',
        'info',
      )
    } else {
      showToast('No pudimos completar la conexión con Google Calendar.', 'info')
    }

    const next = new URLSearchParams(searchParams)
    next.delete('googleCalendar')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, showToast])

  useEffect(() => {
    if (!scheduleQueryKey) {
      return
    }

    const next = new URLSearchParams(searchParams)
    if (!next.has('contactId') && !next.has('action')) {
      return
    }

    next.delete('contactId')
    next.delete('action')
    setSearchParams(next, { replace: true })
  }, [scheduleQueryKey, searchParams, setSearchParams])

  const filteredMeetings = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    return meetings.filter((meeting) => {
      const start = timestampToDate(meeting.startAt)
      if (!start) {
        return false
      }

      if (filter === 'today') {
        return meeting.status === 'scheduled' && start >= todayStart && start <= todayEnd
      }

      if (filter === 'upcoming') {
        return meeting.status === 'scheduled' && start >= todayStart
      }

      if (filter === 'completed') {
        return meeting.status === 'completed' || meeting.status === 'no_show'
      }

      if (filter === 'cancelled') {
        return meeting.status === 'cancelled'
      }

      return true
    })
  }, [filter, meetings])

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date())
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [])

  const monthDays = useMemo(() => getMonthCalendarDays(monthCursor), [monthCursor])

  function openCreate() {
    setScheduleMode('create')
    setEditingMeeting(null)
    setPreselectedContactId(undefined)
    setScheduleSession((value) => value + 1)
    setScheduleOpen(true)
  }

  function handleSaved(meeting: Meeting) {
    showToast(
      scheduleMode === 'edit' ? 'Reunión actualizada.' : 'Reunión creada correctamente.',
      'success',
    )
    setSelectedMeeting(meeting)
    void reload()
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
            Sistema de crecimiento
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-hero-text">Agenda</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-hero-text/70">
            Organiza tus reuniones, conecta con tus contactos y no pierdas ningún seguimiento.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="min-h-11 bg-gold text-petrol-deep hover:bg-gold-light"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva reunión
        </Button>
      </header>

      <GoogleCalendarStatusCard onStatusChange={handleGoogleStatusChange} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'min-h-10 rounded-lg border px-3 text-sm font-medium transition-colors',
                filter === item.id
                  ? 'border-gold bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/75 hover:bg-white/8',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {([
            ['list', 'Lista'],
            ['week', 'Semana'],
            ['month', 'Mes'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                'min-h-10 rounded-lg border px-3 text-sm font-medium',
                viewMode === mode
                  ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando agenda...
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No tienes reuniones programadas."
          description="Agenda una conversación y convierte tu próximo contacto en una acción concreta."
          className="border-white/15 bg-white/5 [&_h3]:text-hero-text [&_p]:text-hero-text/70"
          action={
            <Button
              type="button"
              onClick={openCreate}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear mi primera reunión
            </Button>
          }
        />
      ) : viewMode === 'week' ? (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((day) => {
            const dayMeetings = filteredMeetings.filter((meeting) => {
              const start = timestampToDate(meeting.startAt)
              return start ? isSameDay(start, day) : false
            })

            return (
              <div
                key={day.toISOString()}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-hero-text/55">
                  {day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                </p>
                <div className="mt-2 space-y-2">
                  {dayMeetings.length === 0 ? (
                    <p className="text-xs text-hero-text/40">Sin reuniones</p>
                  ) : (
                    dayMeetings.map((meeting) => (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => setSelectedMeeting(meeting)}
                        className="w-full rounded-lg border border-gold/20 bg-gold/10 px-2 py-2 text-left text-xs text-hero-text hover:bg-gold/15"
                      >
                        <span className="block font-semibold">{meeting.title}</span>
                        <span className="text-hero-text/65">
                          {timestampToDate(meeting.startAt)?.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : viewMode === 'month' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-hero-text/80"
              onClick={() =>
                setMonthCursor((current) => startOfMonth(new Date(current.getFullYear(), current.getMonth() - 1, 1)))
              }
            >
              Anterior
            </button>
            <p className="text-sm font-semibold capitalize text-hero-text">
              {monthCursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              className="min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-hero-text/80"
              onClick={() =>
                setMonthCursor((current) => startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1)))
              }
            >
              Siguiente
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-hero-text/45 sm:gap-2 sm:text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthDays.map((day) => {
              const inCurrentMonth = day.getMonth() === monthCursor.getMonth()
              const dayMeetings = filteredMeetings.filter((meeting) => {
                const start = timestampToDate(meeting.startAt)
                return start ? isSameDay(start, day) : false
              })
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-20 rounded-xl border p-1.5 sm:min-h-28 sm:p-2',
                    inCurrentMonth
                      ? 'border-white/10 bg-white/5'
                      : 'border-white/5 bg-white/[0.02] opacity-55',
                    isToday && 'border-gold/40',
                  )}
                >
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isToday ? 'text-gold-light' : 'text-hero-text/70',
                    )}
                  >
                    {day.getDate()}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayMeetings.slice(0, 3).map((meeting) => (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => setSelectedMeeting(meeting)}
                        className="w-full truncate rounded-md border border-gold/20 bg-gold/10 px-1 py-0.5 text-left text-[10px] text-hero-text hover:bg-gold/15 sm:text-xs"
                        title={meeting.title}
                      >
                        {meeting.title}
                      </button>
                    ))}
                    {dayMeetings.length > 3 ? (
                      <p className="text-[10px] text-hero-text/45">+{dayMeetings.length - 3}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              currentUserId={currentUserId}
              onOpen={setSelectedMeeting}
            />
          ))}
        </div>
      )}

      {scheduleOpen ? (
        <ScheduleMeetingModal
          key={`schedule-${scheduleSession}-${scheduleMode}-${editingMeeting?.id ?? 'new'}`}
          open={scheduleOpen}
          mode={scheduleMode}
          organizerId={organizerId}
          organizerName={organizerName}
          contacts={contacts}
          googleStatus={googleStatus}
          meeting={editingMeeting}
          preselectedContactId={preselectedContactId}
          onClose={() => setScheduleOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}

      <MeetingDetailModal
        meeting={selectedMeeting}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onClose={() => setSelectedMeeting(null)}
        onEdit={(meeting) => {
          setSelectedMeeting(null)
          setEditingMeeting(meeting)
          setScheduleMode('edit')
          setScheduleSession((value) => value + 1)
          setScheduleOpen(true)
        }}
        onReschedule={(meeting) => {
          setSelectedMeeting(null)
          setRescheduleMeeting(meeting)
        }}
        onRecordResult={(meeting) => {
          setSelectedMeeting(null)
          setResultMeeting(meeting)
        }}
        onCreateNextAction={(meeting) => {
          setSelectedMeeting(null)
          setNextActionMeeting(meeting)
        }}
        onChanged={(meeting) => {
          setSelectedMeeting(meeting)
          void reload()
        }}
      />

      <RescheduleMeetingModal
        meeting={rescheduleMeeting}
        organizerId={organizerId}
        onClose={() => setRescheduleMeeting(null)}
        onSaved={() => {
          setRescheduleMeeting(null)
          void reload()
        }}
      />

      <RecordMeetingResultModal
        meeting={resultMeeting}
        organizerId={organizerId}
        onClose={() => setResultMeeting(null)}
        onSaved={() => {
          setResultMeeting(null)
          void reload()
        }}
        onOfferNextAction={(meeting) => {
          setNextActionMeeting(meeting)
        }}
      />

      <CreateMeetingNextActionModal
        meeting={nextActionMeeting}
        open={Boolean(nextActionMeeting)}
        onClose={() => setNextActionMeeting(null)}
        onCreated={() => {
          setNextActionMeeting(null)
          showToast('Próxima acción creada en tu Plan de Acción.', 'success')
          void reload()
        }}
      />
    </div>
  )
}
