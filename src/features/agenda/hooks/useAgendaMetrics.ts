import { useCallback, useEffect, useMemo, useState } from 'react'
import { actionPlanService } from '@/features/action-plan/services/action-plan.service'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import { teamAgendaMetricsFunctionsService } from '@/features/agenda/services/team-agenda-metrics-functions.service'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import {
  calculateAgendaPersonalKpis,
  getAgendaMetricsRange,
  selectUpcomingMeetings,
  type AgendaMetricsRangePreset,
  type AgendaPersonalKpis,
  type AgendaTeamMemberMetrics,
} from '@/features/agenda/utils/agendaMetricsUtils'
import { timestampToDate } from '@/features/agenda/utils/meetingDateUtils'

function toMetricMeeting(meeting: Meeting) {
  const start = timestampToDate(meeting.startAt)
  return {
    id: meeting.id,
    status: meeting.status,
    startAtMs: start?.getTime() ?? 0,
    title: meeting.title,
    meetingMode: meeting.meetingMode,
    meetingAudience: meeting.meetingAudience,
    groupNameSnapshot: meeting.groupNameSnapshot,
    nextActionTaskId: meeting.nextActionTaskId,
  }
}

export function useAgendaMetrics(options: {
  uid: string | null
  ownedTeamId: string | null
  scope: 'mine' | 'team'
  enabled: boolean
}) {
  const [preset, setPreset] = useState<AgendaMetricsRangePreset>('week')
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [personalKpis, setPersonalKpis] = useState<AgendaPersonalKpis | null>(null)
  const [upcoming, setUpcoming] = useState<ReturnType<typeof selectUpcomingMeetings>>([])
  const [teamMembers, setTeamMembers] = useState<AgendaTeamMemberMetrics[]>([])

  const range = useMemo(() => getAgendaMetricsRange(preset), [preset])
  const rangeStartMs = range.rangeStart.getTime()
  const rangeEndMs = range.rangeEnd.getTime()

  const reload = useCallback(async () => {
    if (!options.enabled || !options.uid) {
      setMeetings([])
      setPersonalKpis(null)
      setUpcoming([])
      setTeamMembers([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (options.scope === 'team') {
        if (!options.ownedTeamId) {
          setTeamMembers([])
          setPersonalKpis(null)
          setUpcoming([])
          return
        }
        const result = await teamAgendaMetricsFunctionsService.getTeamAgendaMetrics({
          teamId: options.ownedTeamId,
          rangeStartIso: new Date(rangeStartMs).toISOString(),
          rangeEndIso: new Date(rangeEndMs).toISOString(),
        })
        setTeamMembers(result.members || [])
        setPersonalKpis(null)
        setUpcoming([])
        setMeetings([])
      } else {
        const [items, tasks] = await Promise.all([
          meetingsService.listMeetingsForUser(options.uid, {
            rangeStart: new Date(rangeStartMs),
            rangeEnd: new Date(rangeEndMs),
          }),
          actionPlanService.getTasksByOwner(options.uid).catch(() => []),
        ])
        const metricMeetings = items.map(toMetricMeeting).filter((m) => m.startAtMs > 0)
        const kpis = calculateAgendaPersonalKpis({
          meetings: metricMeetings,
          tasks: tasks.map((task) => ({
            id: task.id,
            source: task.source,
            sourceMeetingId: task.sourceMeetingId,
          })),
          rangeStartMs,
          rangeEndMs,
        })
        setMeetings(items)
        setPersonalKpis(kpis)
        setUpcoming(
          selectUpcomingMeetings(metricMeetings, {
            nowMs: Date.now(),
            rangeStartMs,
            rangeEndMs,
            limit: 5,
          }),
        )
        setTeamMembers([])
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.message.trim()
          ? loadError.message
          : 'No pudimos cargar las métricas.',
      )
      setPersonalKpis(null)
      setUpcoming([])
      setTeamMembers([])
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }, [
    options.enabled,
    options.uid,
    options.ownedTeamId,
    options.scope,
    rangeStartMs,
    rangeEndMs,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  return {
    preset,
    setPreset,
    collapsed,
    setCollapsed,
    loading,
    error,
    personalKpis,
    upcoming,
    teamMembers,
    meetings,
    range,
    reload,
  }
}
