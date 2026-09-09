import { useCallback, useEffect, useState } from 'react'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import {
  AgendaMeetingsQueryError,
  meetingsService,
} from '@/features/agenda/services/meetings.service'
import { useAuth } from '@/features/auth/hooks/useAuth'

function resolveMeetingsLoadError(loadError: unknown): string {
  if (loadError instanceof AgendaMeetingsQueryError) {
    if (loadError.code === 'permission-denied') {
      return `No tienes permiso para listar reuniones (${loadError.queryType}).`
    }
    if (
      loadError.code === 'unavailable' ||
      loadError.code === 'deadline-exceeded' ||
      loadError.code === 'cancelled'
    ) {
      return 'No pudimos conectar con Firestore. Revisa red o bloqueadores del navegador.'
    }
    if (loadError.code === 'failed-precondition') {
      return 'Falta un índice de Firestore para Agenda. Contacta soporte.'
    }
    return loadError.message || 'No pudimos cargar tus reuniones.'
  }

  if (loadError instanceof Error && loadError.message.trim()) {
    return loadError.message
  }

  return 'No pudimos cargar tus reuniones.'
}

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
      setError(resolveMeetingsLoadError(loadError))
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
