import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Loader2, Plus, Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button, EmptyState, Input } from '@/components/ui'
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
  GoogleCalendarConnectionStatus,
  Meeting,
  MeetingAudience,
  MeetingMode,
  MeetingStatus,
} from '@/features/agenda/types/meeting.types'
import {
  EMPTY_ADVANCED_FILTERS,
  applyAdvancedFilters,
  filterTeamVisibleMeetings,
  formatViewRangeLabel,
  getViewRange,
  shiftAnchor,
  type AgendaAdvancedFilters,
  type AgendaCalendarView,
} from '@/features/agenda/utils/agendaScheduleUtils'
import {
  loadAgendaViewPreference,
  saveAgendaViewPreference,
} from '@/features/agenda/utils/agendaViewPrefs'
import {
  addDays,
  getMonthCalendarDays,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  timestampToDate,
} from '@/features/agenda/utils/meetingDateUtils'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact } from '@/features/contacts/types/contact.types'
import { listAccessibleTeamsForScheduling } from '@/features/agenda/utils/meetingGroupService'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: Array<{ id: AgendaCalendarView; label: string; mobilePriority?: boolean }> = [
  { id: 'day', label: 'Día', mobilePriority: true },
  { id: 'list', label: 'Lista', mobilePriority: true },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
]

const STATUS_OPTIONS: Array<{ id: MeetingStatus; label: string }> = [
  { id: 'scheduled', label: 'Programada' },
  { id: 'completed', label: 'Realizada' },
  { id: 'no_show', label: 'No asistió' },
  { id: 'cancelled', label: 'Cancelada' },
]

const MODE_OPTIONS: Array<{ id: MeetingMode; label: string }> = [
  { id: 'video', label: 'Video' },
  { id: 'in_person', label: 'Presencial' },
  { id: 'other', label: 'Otra' },
]

const AUDIENCE_OPTIONS: Array<{ id: MeetingAudience; label: string }> = [
  { id: 'individual', label: 'Individual' },
  { id: 'group', label: 'Grupo' },
]

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function AgendaPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<AgendaCalendarView>(() => loadAgendaViewPreference('list'))
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()))
  const queryRange = useMemo(() => getViewRange(viewMode, anchorDate), [viewMode, anchorDate])
  const { meetings, loading, error, reload, organizerId, currentUserId, isAdmin, organizerName, ownedTeamId } =
    useMeetings(queryRange)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [filters, setFilters] = useState<AgendaAdvancedFilters>(EMPTY_ADVANCED_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [agendaScope, setAgendaScope] = useState<'mine' | 'team'>('mine')
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>('all')
  const [accessibleGroups, setAccessibleGroups] = useState<Array<{ id: string; name: string }>>([])

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

  const canShowTeamScope = Boolean(ownedTeamId)
  const rangeLabel = formatViewRangeLabel(viewMode, anchorDate)

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
    if (!meetingDeepLinkId || meetingDeepLinkId !== consumedMeetingDeepLink) return
    const next = new URLSearchParams(searchParams)
    if (!next.has('meetingId')) return
    next.delete('meetingId')
    setSearchParams(next, { replace: true })
  }, [meetingDeepLinkId, consumedMeetingDeepLink, searchParams, setSearchParams])

  useEffect(() => {
    if (!organizerId) return
    void contactsService.getContactsByOwner(organizerId).then(setContacts).catch(() => setContacts([]))
  }, [organizerId])

  useEffect(() => {
    if (!organizerId) return
    void listAccessibleTeamsForScheduling(organizerId)
      .then((teams) => {
        setAccessibleGroups(teams.map((team) => ({ id: team.id, name: team.name })))
      })
      .catch(() => setAccessibleGroups([]))
  }, [organizerId])

  const teamMembers = useMemo(() => {
    if (agendaScope !== 'team' || !ownedTeamId) return []
    const byUid = new Map<string, string>()
    for (const meeting of filterTeamVisibleMeetings(meetings, ownedTeamId)) {
      if (meeting.organizerId) {
        byUid.set(meeting.organizerId, meeting.organizerName || meeting.organizerId)
      }
      for (const participant of meeting.participants || []) {
        if (participant.userId) {
          byUid.set(participant.userId, participant.name || participant.userId)
        }
      }
    }
    return [...byUid.entries()].map(([uid, name]) => ({ uid, name }))
  }, [agendaScope, meetings, ownedTeamId])

  useEffect(() => {
    const googleParam = searchParams.get('googleCalendar')
    if (!googleParam) return
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
    if (!scheduleQueryKey) return
    const next = new URLSearchParams(searchParams)
    if (!next.has('contactId') && !next.has('action')) return
    next.delete('contactId')
    next.delete('action')
    setSearchParams(next, { replace: true })
  }, [scheduleQueryKey, searchParams, setSearchParams])

  const scopedMeetings = useMemo(() => {
    if (agendaScope === 'team' && ownedTeamId) {
      let items = filterTeamVisibleMeetings(meetings, ownedTeamId)
      if (teamMemberFilter !== 'all') {
        items = items.filter(
          (meeting) =>
            meeting.organizerId === teamMemberFilter ||
            (meeting.participantUserIds || []).includes(teamMemberFilter),
        )
      }
      return items
    }
    return meetings
  }, [agendaScope, meetings, ownedTeamId, teamMemberFilter])

  const filteredMeetings = useMemo(
    () => applyAdvancedFilters(scopedMeetings, filters, currentUserId),
    [scopedMeetings, filters, currentUserId],
  )

  const dayMeetingsSorted = useMemo(() => {
    return [...filteredMeetings]
      .filter((meeting) => {
        const start = timestampToDate(meeting.startAt)
        return start ? isSameDay(start, anchorDate) : false
      })
      .sort((left, right) => {
        const leftMs = timestampToDate(left.startAt)?.getTime() ?? 0
        const rightMs = timestampToDate(right.startAt)?.getTime() ?? 0
        return leftMs - rightMs
      })
  }, [filteredMeetings, anchorDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [anchorDate])

  const monthDays = useMemo(() => getMonthCalendarDays(anchorDate), [anchorDate])
  const monthCursor = startOfMonth(anchorDate)

  const activeFilterCount =
    filters.statuses.length +
    filters.modes.length +
    filters.audiences.length +
    (filters.groupId ? 1 : 0) +
    (filters.role !== 'all' ? 1 : 0)

  function changeView(mode: AgendaCalendarView) {
    setViewMode(mode)
    saveAgendaViewPreference(mode)
  }

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

  function clearFilters() {
    setFilters(EMPTY_ADVANCED_FILTERS)
  }

  const filtersPanel = (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-hero-text">Filtros</p>
        <button
          type="button"
          className="text-xs font-medium text-gold-light hover:underline"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">Estado</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  statuses: toggleInList(current.statuses, item.id),
                }))
              }
              className={cn(
                'min-h-9 rounded-lg border px-2.5 text-xs font-medium',
                filters.statuses.includes(item.id)
                  ? 'border-gold bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  modes: toggleInList(current.modes, item.id),
                }))
              }
              className={cn(
                'min-h-9 rounded-lg border px-2.5 text-xs font-medium',
                filters.modes.includes(item.id)
                  ? 'border-gold bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">Audiencia</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  audiences: toggleInList(current.audiences, item.id),
                }))
              }
              className={cn(
                'min-h-9 rounded-lg border px-2.5 text-xs font-medium',
                filters.audiences.includes(item.id)
                  ? 'border-gold bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">Grupo</p>
        <select
          className="min-h-10 w-full rounded-lg border border-white/15 bg-petrol-deep px-3 text-sm text-hero-text"
          value={filters.groupId || ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              groupId: event.target.value || null,
            }))
          }
        >
          <option value="">Todos los grupos accesibles</option>
          {accessibleGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">Rol</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Todos'],
              ['organized', 'Organizadas por mí'],
              ['invited', 'Invitado'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilters((current) => ({ ...current, role: id }))}
              className={cn(
                'min-h-9 rounded-lg border px-2.5 text-xs font-medium',
                filters.role === id
                  ? 'border-gold bg-gold/15 text-gold-light'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

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

      {canShowTeamScope ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAgendaScope('mine')}
            className={cn(
              'min-h-10 rounded-lg border px-3 text-sm font-medium',
              agendaScope === 'mine'
                ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                : 'border-white/15 bg-white/5 text-hero-text/75',
            )}
          >
            Mi agenda
          </button>
          <button
            type="button"
            onClick={() => setAgendaScope('team')}
            className={cn(
              'min-h-10 rounded-lg border px-3 text-sm font-medium',
              agendaScope === 'team'
                ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                : 'border-white/15 bg-white/5 text-hero-text/75',
            )}
          >
            Agenda del equipo
          </button>
        </div>
      ) : null}

      {agendaScope === 'team' ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Solo reuniones de grupo de tu equipo a las que ya tienes acceso. No se muestran agendas
          privadas de otros miembros.
          {teamMembers.length > 0 ? (
            <div className="mt-2">
              <select
                className="min-h-9 rounded-lg border border-white/15 bg-petrol-deep px-2 text-sm text-hero-text"
                value={teamMemberFilter}
                onChange={(event) => setTeamMemberFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {teamMembers.map((member) => (
                  <option key={member.uid} value={member.uid}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeView(item.id)}
              className={cn(
                'min-h-10 rounded-lg border px-3 text-sm font-medium',
                !item.mobilePriority && 'hidden sm:inline-flex',
                item.mobilePriority && 'inline-flex',
                viewMode === item.id
                  ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                  : 'border-white/15 bg-white/5 text-hero-text/75',
              )}
            >
              {item.label}
            </button>
          ))}
          {/* Always allow week/month on mobile via compact row */}
          <div className="flex gap-2 sm:hidden">
            {VIEW_OPTIONS.filter((item) => !item.mobilePriority).map((item) => (
              <button
                key={`m-${item.id}`}
                type="button"
                onClick={() => changeView(item.id)}
                className={cn(
                  'min-h-10 rounded-lg border px-3 text-sm font-medium',
                  viewMode === item.id
                    ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                    : 'border-white/15 bg-white/5 text-hero-text/75',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Anterior"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-hero-text"
            onClick={() => setAnchorDate((current) => shiftAnchor(viewMode, current, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-hero-text"
            onClick={() => setAnchorDate(startOfDay(new Date()))}
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-hero-text"
            onClick={() => setAnchorDate((current) => shiftAnchor(viewMode, current, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold capitalize text-hero-text sm:flex-none">
            {rangeLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hero-text/45" />
          <Input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="Buscar título, contacto, grupo o participante"
            className="min-h-11 border-white/15 bg-white/5 pl-10 text-hero-text placeholder:text-hero-text/40"
          />
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-hero-text lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden lg:block">{filtersPanel}</div>

        <div className="min-w-0">
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
              title="No hay reuniones en este rango."
              description="Prueba otro periodo, limpia filtros o agenda una nueva conversación."
              className="border-white/15 bg-white/5 [&_h3]:text-hero-text [&_p]:text-hero-text/70"
              action={
                <Button
                  type="button"
                  onClick={openCreate}
                  className="bg-gold text-petrol-deep hover:bg-gold-light"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva reunión
                </Button>
              }
            />
          ) : viewMode === 'day' ? (
            <div className="space-y-3">
              {dayMeetingsSorted.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={currentUserId}
                  onOpen={setSelectedMeeting}
                />
              ))}
            </div>
          ) : viewMode === 'week' ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[640px] gap-3 md:grid-cols-7">
                {weekDays.map((day) => {
                  const items = filteredMeetings.filter((meeting) => {
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
                        {items.length === 0 ? (
                          <p className="text-xs text-hero-text/40">Sin reuniones</p>
                        ) : (
                          items.map((meeting) => (
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
            </div>
          ) : viewMode === 'month' ? (
            <div className="space-y-3 overflow-x-auto">
              <div className="grid min-w-[560px] grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-hero-text/45 sm:gap-2 sm:text-xs">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
                  <div key={label} className="py-1">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid min-w-[560px] grid-cols-7 gap-1 sm:gap-2">
                {monthDays.map((day) => {
                  const inCurrentMonth = day.getMonth() === monthCursor.getMonth()
                  const items = filteredMeetings.filter((meeting) => {
                    const start = timestampToDate(meeting.startAt)
                    return start ? isSameDay(start, day) : false
                  })
                  const isToday = isSameDay(day, new Date())
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => {
                        setAnchorDate(startOfDay(day))
                        changeView('day')
                      }}
                      className={cn(
                        'min-h-20 rounded-xl border p-1.5 text-left sm:min-h-28 sm:p-2',
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
                        {items.slice(0, 3).map((meeting) => (
                          <span
                            key={meeting.id}
                            className="block truncate rounded-md border border-gold/20 bg-gold/10 px-1 py-0.5 text-[10px] text-hero-text sm:text-xs"
                          >
                            {meeting.title}
                          </span>
                        ))}
                        {items.length > 3 ? (
                          <p className="text-[10px] text-hero-text/45">+{items.length - 3}</p>
                        ) : null}
                      </div>
                    </button>
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
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-petrol-deep p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-hero-text">Filtros</p>
              <button
                type="button"
                className="rounded-lg p-1.5 text-hero-text/70"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filtersPanel}
            <Button
              type="button"
              className="mt-4 w-full bg-gold text-petrol-deep hover:bg-gold-light"
              onClick={() => setFiltersOpen(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      ) : null}

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
