import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Filter, Loader2, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button, EmptyState, Input } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { AgendaCalendarDayView } from '@/features/agenda/components/AgendaCalendarDayView'
import { AgendaCalendarMonthView } from '@/features/agenda/components/AgendaCalendarMonthView'
import { AgendaCalendarWeekView } from '@/features/agenda/components/AgendaCalendarWeekView'
import { AgendaDayDetailsPanel } from '@/features/agenda/components/AgendaDayDetailsPanel'
import { AgendaFiltersPanel } from '@/features/agenda/components/AgendaFiltersPanel'
import { AgendaMetricsPanel } from '@/features/agenda/components/AgendaMetricsPanel'
import { AgendaMobileFiltersDrawer } from '@/features/agenda/components/AgendaMobileFiltersDrawer'
import { AgendaToolbar } from '@/features/agenda/components/AgendaToolbar'
import { CreateMeetingNextActionModal } from '@/features/agenda/components/CreateMeetingNextActionModal'
import { GoogleCalendarStatusCard } from '@/features/agenda/components/GoogleCalendarStatusCard'
import { MeetingCard } from '@/features/agenda/components/MeetingCard'
import { MeetingDetailModal } from '@/features/agenda/components/MeetingDetailModal'
import { RecordMeetingResultModal } from '@/features/agenda/components/RecordMeetingResultModal'
import { RescheduleMeetingModal } from '@/features/agenda/components/RescheduleMeetingModal'
import { ScheduleMeetingModal } from '@/features/agenda/components/ScheduleMeetingModal'
import { useAgendaMetrics } from '@/features/agenda/hooks/useAgendaMetrics'
import { useMeetings } from '@/features/agenda/hooks/useMeetings'
import { useTeamAgenda } from '@/features/agenda/hooks/useTeamAgenda'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import type {
  GoogleCalendarConnectionStatus,
  Meeting,
  MeetingMode,
  MeetingStatus,
} from '@/features/agenda/types/meeting.types'
import {
  EMPTY_ADVANCED_FILTERS,
  applyAdvancedFilters,
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
  endOfMonth,
  getMonthCalendarDays,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  timestampToDate,
} from '@/features/agenda/utils/meetingDateUtils'
import { listAccessibleTeamsForScheduling } from '@/features/agenda/utils/meetingGroupService'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact } from '@/features/contacts/types/contact.types'
import { teamService } from '@/features/team/services/team.service'
import { cn } from '@/lib/utils'

export function AgendaPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<AgendaCalendarView>(() => loadAgendaViewPreference('list'))
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()))
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfDay(new Date()))
  const [dayPanelOpen, setDayPanelOpen] = useState(false)
  const [agendaScope, setAgendaScope] = useState<'mine' | 'team'>('mine')
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>('all')
  const [teamRoster, setTeamRoster] = useState<Array<{ uid: string; name: string }>>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filters, setFilters] = useState<AgendaAdvancedFilters>(EMPTY_ADVANCED_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [accessibleGroups, setAccessibleGroups] = useState<Array<{ id: string; name: string }>>([])
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'create' | 'edit'>('create')
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [rescheduleMeeting, setRescheduleMeeting] = useState<Meeting | null>(null)
  const [resultMeeting, setResultMeeting] = useState<Meeting | null>(null)
  const [nextActionMeeting, setNextActionMeeting] = useState<Meeting | null>(null)
  const [preselectedContactId, setPreselectedContactId] = useState<string | undefined>()
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null)
  const [scheduleSession, setScheduleSession] = useState(0)
  const [consumedScheduleQuery, setConsumedScheduleQuery] = useState('')
  const [consumedMeetingDeepLink, setConsumedMeetingDeepLink] = useState('')
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarConnectionStatus>({
    connected: false,
    email: null,
    configured: false,
  })

  const effectiveViewMode: AgendaCalendarView =
    agendaScope === 'team' && viewMode === 'list' ? 'day' : viewMode
  const queryRange = useMemo(
    () => getViewRange(effectiveViewMode, anchorDate),
    [effectiveViewMode, anchorDate],
  )
  const { meetings, loading, error, reload, organizerId, currentUserId, isAdmin, organizerName, ownedTeamId } =
    useMeetings(queryRange)

  const isTeamScope = agendaScope === 'team' && Boolean(ownedTeamId)
  const canShowTeamScope = Boolean(ownedTeamId)
  const [metricsScope, setMetricsScope] = useState<'mine' | 'team'>('mine')
  const metrics = useAgendaMetrics({
    uid: currentUserId || null,
    ownedTeamId,
    scope: metricsScope === 'team' && ownedTeamId ? 'team' : 'mine',
    enabled: Boolean(currentUserId),
  })
  const teamQueryRange = useMemo(() => {
    if (effectiveViewMode === 'month') {
      return { rangeStart: startOfMonth(anchorDate), rangeEnd: endOfMonth(anchorDate) }
    }
    return queryRange
  }, [effectiveViewMode, anchorDate, queryRange])
  const teamQueryMemberUid = teamMemberFilter === 'all' ? null : teamMemberFilter
  const {
    slots: teamSlots,
    loading: teamLoading,
    error: teamError,
    reload: reloadTeamAgenda,
  } = useTeamAgenda({
    enabled: isTeamScope,
    teamId: ownedTeamId,
    rangeStart: teamQueryRange.rangeStart,
    rangeEnd: teamQueryRange.rangeEnd,
    memberUid: teamQueryMemberUid,
  })

  const rangeLabel = formatViewRangeLabel(effectiveViewMode, anchorDate)
  const detailDay = selectedDay ?? anchorDate
  const showDaySidebar =
    dayPanelOpen && (effectiveViewMode === 'week' || effectiveViewMode === 'month')

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
    setPreselectedDate(null)
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

  useEffect(() => {
    if (!isTeamScope || !ownedTeamId || !currentUserId) return
    let cancelled = false
    void teamService
      .getTeamMembersByTeamId(ownedTeamId, currentUserId)
      .then((members) => {
        if (cancelled) return
        setTeamRoster(
          members
            .filter((member) => member.status === 'active')
            .map((member) => ({
              uid: member.memberUid,
              name: member.memberName?.trim() || member.memberEmail?.trim() || 'Miembro',
            })),
        )
      })
      .catch(() => {
        if (!cancelled) setTeamRoster([])
      })
    return () => {
      cancelled = true
    }
  }, [isTeamScope, ownedTeamId, currentUserId])

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

  const filteredMeetings = useMemo(
    () => applyAdvancedFilters(meetings, filters, currentUserId),
    [meetings, filters, currentUserId],
  )

  const memberNameByUid = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of teamRoster) {
      map.set(member.uid, member.name)
    }
    return map
  }, [teamRoster])

  const filteredTeamSlots = useMemo(() => {
    return teamSlots.filter((slot) => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(slot.status as MeetingStatus)) {
        return false
      }
      if (filters.modes.length > 0 && !filters.modes.includes(slot.meetingMode as MeetingMode)) {
        return false
      }
      return true
    })
  }, [teamSlots, filters.statuses, filters.modes])

  const accessibleMeetingById = useMemo(() => {
    const map = new Map<string, Meeting>()
    for (const meeting of meetings) {
      map.set(meeting.id, meeting)
    }
    return map
  }, [meetings])

  function resolveAccessibleMeeting(slot: TeamAgendaSlot): Meeting | null {
    return accessibleMeetingById.get(slot.meetingId) ?? null
  }

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

  const dayTeamSlotsSorted = useMemo(() => {
    return [...filteredTeamSlots]
      .filter((slot) => isSameDay(new Date(slot.startAt), anchorDate))
      .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
  }, [filteredTeamSlots, anchorDate])

  const detailMeetingsSorted = useMemo(() => {
    return [...filteredMeetings]
      .filter((meeting) => {
        const start = timestampToDate(meeting.startAt)
        return start ? isSameDay(start, detailDay) : false
      })
      .sort((left, right) => {
        const leftMs = timestampToDate(left.startAt)?.getTime() ?? 0
        const rightMs = timestampToDate(right.startAt)?.getTime() ?? 0
        return leftMs - rightMs
      })
  }, [filteredMeetings, detailDay])

  const detailTeamSlotsSorted = useMemo(() => {
    return [...filteredTeamSlots]
      .filter((slot) => isSameDay(new Date(slot.startAt), detailDay))
      .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
  }, [filteredTeamSlots, detailDay])

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [anchorDate])

  const monthDays = useMemo(() => getMonthCalendarDays(anchorDate), [anchorDate])
  const monthCursor = startOfMonth(anchorDate)

  const activeFilterCount =
    filters.statuses.length +
    filters.modes.length +
    (isTeamScope
      ? 0
      : filters.audiences.length +
        (filters.groupId ? 1 : 0) +
        (filters.role !== 'all' ? 1 : 0))

  function changeView(mode: AgendaCalendarView) {
    if (agendaScope === 'team' && mode === 'list') {
      setViewMode('day')
      saveAgendaViewPreference('day')
      setDayPanelOpen(false)
      return
    }
    setViewMode(mode)
    saveAgendaViewPreference(mode)
    if (mode === 'day' || mode === 'list') {
      setDayPanelOpen(false)
    }
  }

  function setScope(scope: 'mine' | 'team') {
    setAgendaScope(scope)
    setDayPanelOpen(false)
  }

  function openCreate() {
    setScheduleMode('create')
    setEditingMeeting(null)
    setPreselectedContactId(undefined)
    setPreselectedDate(null)
    setScheduleSession((value) => value + 1)
    setScheduleOpen(true)
  }

  function openCreateForDay(day: Date) {
    setScheduleMode('create')
    setEditingMeeting(null)
    setPreselectedContactId(undefined)
    setPreselectedDate(startOfDay(day))
    setScheduleSession((value) => value + 1)
    setScheduleOpen(true)
  }

  function handleSelectDay(day: Date) {
    const next = startOfDay(day)
    setSelectedDay(next)
    if (effectiveViewMode === 'day') {
      setAnchorDate(next)
      setDayPanelOpen(false)
      return
    }
    if (effectiveViewMode === 'week' || effectiveViewMode === 'month') {
      setDayPanelOpen(true)
    }
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

  const filterProps = {
    filters,
    onChange: setFilters,
    onClear: clearFilters,
    isTeamScope,
    accessibleGroups,
    activeFilterCount,
  }

  function renderCalendarBody() {
    if (isTeamScope) {
      if (teamLoading) {
        return (
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando agenda del equipo...
          </p>
        )
      }
      if (teamError) {
        return (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {teamError}
          </p>
        )
      }
      if (effectiveViewMode === 'day') {
        return (
          <AgendaCalendarDayView
            mode="team"
            day={anchorDate}
            slots={dayTeamSlotsSorted}
            memberNameByUid={memberNameByUid}
            resolveAccessibleMeeting={resolveAccessibleMeeting}
            onOpenMeeting={setSelectedMeeting}
          />
        )
      }
      if (effectiveViewMode === 'week') {
        return (
          <AgendaCalendarWeekView
            mode="team"
            weekDays={weekDays}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
            slots={filteredTeamSlots}
            memberNameByUid={memberNameByUid}
            resolveAccessibleMeeting={resolveAccessibleMeeting}
            onOpenMeeting={setSelectedMeeting}
          />
        )
      }
      return (
        <AgendaCalendarMonthView
          mode="team"
          monthDays={monthDays}
          monthCursor={monthCursor}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          slots={filteredTeamSlots}
          memberNameByUid={memberNameByUid}
          resolveAccessibleMeeting={resolveAccessibleMeeting}
          onOpenMeeting={setSelectedMeeting}
        />
      )
    }

    if (loading) {
      return (
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando agenda...
        </p>
      )
    }

    if (error) {
      return (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )
    }

    if (effectiveViewMode === 'list') {
      if (filteredMeetings.length === 0) {
        return (
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
                Nueva reunión
              </Button>
            }
          />
        )
      }
      return (
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
      )
    }

    if (effectiveViewMode === 'day') {
      return (
        <AgendaCalendarDayView
          mode="personal"
          day={anchorDate}
          meetings={dayMeetingsSorted}
          currentUserId={currentUserId}
          onOpenMeeting={setSelectedMeeting}
        />
      )
    }

    if (effectiveViewMode === 'week') {
      return (
        <AgendaCalendarWeekView
          mode="personal"
          weekDays={weekDays}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          meetings={filteredMeetings}
          onOpenMeeting={setSelectedMeeting}
        />
      )
    }

    return (
      <AgendaCalendarMonthView
        mode="personal"
        monthDays={monthDays}
        monthCursor={monthCursor}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
        meetings={filteredMeetings}
        onOpenMeeting={setSelectedMeeting}
      />
    )
  }

  return (
    <div className="space-y-5 px-4 py-6 sm:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
          Sistema de crecimiento
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-hero-text">Agenda</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-hero-text/70">
          Organiza, acompaña y haz crecer cada relación.
        </p>
      </header>

      <GoogleCalendarStatusCard onStatusChange={handleGoogleStatusChange} />

      {canShowTeamScope ? (
        <div className="inline-flex rounded-xl border border-white/12 bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setScope('mine')}
            className={cn(
              'min-h-9 rounded-lg px-3 text-sm font-medium transition-colors',
              agendaScope === 'mine'
                ? 'bg-teal-accent/20 text-teal-accent'
                : 'text-hero-text/70 hover:bg-white/5',
            )}
          >
            Mi agenda
          </button>
          <button
            type="button"
            onClick={() => setScope('team')}
            className={cn(
              'min-h-9 rounded-lg px-3 text-sm font-medium transition-colors',
              agendaScope === 'team'
                ? 'bg-teal-accent/20 text-teal-accent'
                : 'text-hero-text/70 hover:bg-white/5',
            )}
          >
            Agenda del equipo
          </button>
        </div>
      ) : null}

      {isTeamScope ? (
        <div className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-xs text-hero-text/70">
          Disponibilidad operativa del equipo. No se muestran notas, enlaces ni detalles privados de
          reuniones ajenas.
          <div className="mt-2">
            <select
              className="min-h-9 rounded-lg border border-white/15 bg-petrol-deep px-2 text-sm text-hero-text"
              value={teamMemberFilter}
              onChange={(event) => setTeamMemberFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              {teamRoster.map((member) => (
                <option key={member.uid} value={member.uid}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <AgendaToolbar
        rangeLabel={rangeLabel}
        effectiveViewMode={effectiveViewMode}
        viewMode={viewMode}
        isTeamScope={isTeamScope}
        onChangeView={changeView}
        onPrev={() => {
          setAnchorDate((current) => shiftAnchor(effectiveViewMode, current, -1))
          setDayPanelOpen(false)
        }}
        onNext={() => {
          setAnchorDate((current) => shiftAnchor(effectiveViewMode, current, 1))
          setDayPanelOpen(false)
        }}
        onToday={() => {
          const today = startOfDay(new Date())
          setAnchorDate(today)
          setSelectedDay(today)
          setDayPanelOpen(false)
        }}
        onCreate={openCreate}
      />

      <AgendaMetricsPanel
        canShowTeam={canShowTeamScope}
        metricsScope={metricsScope === 'team' && canShowTeamScope ? 'team' : 'mine'}
        onMetricsScopeChange={setMetricsScope}
        preset={metrics.preset}
        onPresetChange={metrics.setPreset}
        collapsed={metrics.collapsed}
        onCollapsedChange={metrics.setCollapsed}
        loading={metrics.loading}
        error={metrics.error}
        personalKpis={metrics.personalKpis}
        upcoming={metrics.upcoming}
        teamMembers={metrics.teamMembers}
        onOpenMeeting={(meetingId) => {
          const found = meetings.find((item) => item.id === meetingId)
          if (found) setSelectedMeeting(found)
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {!isTeamScope ? (
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
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-medium text-hero-text lg:hidden"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      <div
        className={cn(
          'grid gap-4',
          showDaySidebar
            ? 'lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_320px]'
            : 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]',
        )}
      >
        <div className="hidden lg:block">
          <AgendaFiltersPanel {...filterProps} />
        </div>

        <div className="min-w-0">{renderCalendarBody()}</div>

        {showDaySidebar ? (
          isTeamScope ? (
            <AgendaDayDetailsPanel
              open
              variant="sidebar"
              mode="team"
              day={detailDay}
              slots={detailTeamSlotsSorted}
              memberNameByUid={memberNameByUid}
              resolveAccessibleMeeting={resolveAccessibleMeeting}
              onOpenMeeting={setSelectedMeeting}
              onClose={() => setDayPanelOpen(false)}
            />
          ) : (
            <AgendaDayDetailsPanel
              open
              variant="sidebar"
              mode="personal"
              day={detailDay}
              meetings={detailMeetingsSorted}
              onOpenMeeting={setSelectedMeeting}
              onClose={() => setDayPanelOpen(false)}
              onCreateForDay={() => openCreateForDay(detailDay)}
            />
          )
        ) : null}
      </div>

      {dayPanelOpen && (effectiveViewMode === 'week' || effectiveViewMode === 'month') ? (
        isTeamScope ? (
          <AgendaDayDetailsPanel
            open
            variant="sheet"
            mode="team"
            day={detailDay}
            slots={detailTeamSlotsSorted}
            memberNameByUid={memberNameByUid}
            resolveAccessibleMeeting={resolveAccessibleMeeting}
            onOpenMeeting={setSelectedMeeting}
            onClose={() => setDayPanelOpen(false)}
          />
        ) : (
          <AgendaDayDetailsPanel
            open
            variant="sheet"
            mode="personal"
            day={detailDay}
            meetings={detailMeetingsSorted}
            onOpenMeeting={setSelectedMeeting}
            onClose={() => setDayPanelOpen(false)}
            onCreateForDay={() => openCreateForDay(detailDay)}
          />
        )
      ) : null}

      <AgendaMobileFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        {...filterProps}
      />

      {scheduleOpen ? (
        <ScheduleMeetingModal
          key={`schedule-${scheduleSession}-${scheduleMode}-${editingMeeting?.id ?? 'new'}-${preselectedDate?.toISOString() ?? 'default'}`}
          open={scheduleOpen}
          mode={scheduleMode}
          organizerId={organizerId}
          organizerName={organizerName}
          contacts={contacts}
          googleStatus={googleStatus}
          meeting={editingMeeting}
          preselectedContactId={preselectedContactId}
          initialDate={preselectedDate}
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
          setPreselectedDate(null)
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
          if (isTeamScope) void reloadTeamAgenda()
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
