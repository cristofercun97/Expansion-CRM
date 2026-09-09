import { useCallback, useEffect, useState } from 'react'
import {
  teamAgendaFunctionsService,
  type TeamAgendaMember,
  type TeamAgendaSlot,
} from '@/features/agenda/services/team-agenda-functions.service'

export function useTeamAgenda(options: {
  enabled: boolean
  teamId: string | null
  rangeStart: Date
  rangeEnd: Date
  memberUid: string | null
}) {
  const [slots, setSlots] = useState<TeamAgendaSlot[]>([])
  const [members, setMembers] = useState<TeamAgendaMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const teamId = options.teamId?.trim() || null
  const rangeStartMs = options.rangeStart.getTime()
  const rangeEndMs = options.rangeEnd.getTime()
  const memberUid = options.memberUid?.trim() || null
  const enabled = options.enabled && Boolean(teamId)

  const reload = useCallback(async () => {
    if (!enabled || !teamId) {
      setSlots([])
      setMembers([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await teamAgendaFunctionsService.getTeamAgenda({
        teamId,
        rangeStartIso: new Date(rangeStartMs).toISOString(),
        rangeEndIso: new Date(rangeEndMs).toISOString(),
        memberUid: memberUid || null,
      })
      setSlots(result.slots || [])
      setMembers(result.members || [])
    } catch (loadError) {
      setSlots([])
      setMembers([])
      setError(
        loadError instanceof Error && loadError.message.trim()
          ? loadError.message
          : 'No tienes permiso para ver esta agenda.',
      )
    } finally {
      setLoading(false)
    }
  }, [enabled, teamId, rangeStartMs, rangeEndMs, memberUid])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  return { slots, members, loading, error, reload }
}
