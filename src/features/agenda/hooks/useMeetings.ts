import { useCallback, useEffect, useState } from 'react'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMeetings() {
  const { appUser } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUserId = appUser?.uid ?? ''
  const isAdmin = appUser?.role === 'admin'
  const organizerName =
    appUser?.displayName?.trim() ||
    appUser?.email?.trim() ||
    'Usuario EXPANSIÓN'

  const reload = useCallback(async () => {
    if (!currentUserId) {
      setMeetings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const items = await meetingsService.listMeetingsForUser(currentUserId)
      setMeetings(items)
    } catch (loadError) {
      setMeetings([])
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tus reuniones.',
      )
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [reload])

  return {
    meetings,
    loading,
    error,
    reload,
    currentUserId,
    isAdmin,
    organizerName,
    /** @deprecated use currentUserId — kept for schedule create organizerId */
    organizerId: currentUserId,
  }
}
