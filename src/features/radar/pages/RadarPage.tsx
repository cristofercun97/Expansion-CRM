import { Loader2, Radar } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact } from '@/features/contacts/types/contact.types'
import { RadarHighlights, RadarSummary } from '@/features/radar/components/RadarInsights'
import { RadarKpiGrid } from '@/features/radar/components/RadarKpiGrid'
import {
  DEFAULT_RADAR_PERIOD,
  RadarPeriodFilter,
} from '@/features/radar/components/RadarPeriodFilter'
import { RadarRankedList } from '@/features/radar/components/RadarRankedList'
import { calculateRadarMetrics } from '@/features/radar/utils/radarMetrics'
import {
  filterContactsByPeriod,
  type RadarPeriod,
} from '@/features/radar/utils/radarPeriodFilter'

function logRadarDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function RadarPage() {
  const { currentUser, initialized, loading: authLoading } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [period, setPeriod] = useState<RadarPeriod>(DEFAULT_RADAR_PERIOD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const uid = currentUser?.uid

  const filteredContacts = useMemo(
    () => filterContactsByPeriod(contacts, period),
    [contacts, period],
  )

  const metrics = useMemo(() => calculateRadarMetrics(filteredContacts), [filteredContacts])

  const loadContacts = useCallback(async (ownerUid: string) => {
    setLoading(true)
    setError('')

    try {
      const results = await contactsService.getContactsByOwner(ownerUid)
      setContacts(results)
    } catch (loadError) {
      logRadarDevError('[Radar] Error al cargar prospectos', loadError)
      setContacts([])
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar la información del radar. Intenta nuevamente.',
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

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Debes iniciar sesión para ver el radar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader
        title="Radar de Interés"
        subtitle="Entiende qué buscan tus contactos y dónde enfocar tu seguimiento."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando radar de interés...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="Sin datos de interés todavía"
          description="Comparte tu presentación para empezar a medir qué buscan tus contactos."
          className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
        />
      ) : (
        <>
          <RadarPeriodFilter value={period} onChange={setPeriod} />

          {filteredContacts.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-white/8 px-4 py-8 text-center text-sm text-hero-text/75 backdrop-blur-xl">
              No hay contactos en este período.
            </div>
          ) : (
            <>
              <RadarKpiGrid kpis={metrics.kpis} />
              <RadarHighlights topInterest={metrics.topInterest} topLanding={metrics.topLanding} />

              <div className="grid gap-4 lg:grid-cols-2">
                <RadarRankedList title="Intereses más frecuentes" items={metrics.topInterests} />
                <RadarRankedList
                  title="Presentaciones con más respuestas"
                  items={metrics.topLandings}
                />
              </div>

              <RadarSummary summary={metrics.summary} />
            </>
          )}
        </>
      )}
    </div>
  )
}
