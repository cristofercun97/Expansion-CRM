import { useCallback, useEffect, useState } from 'react'
import { dashboardOverviewService } from '@/features/dashboard/services/dashboard-overview.service'
import type { DashboardOverviewData } from '@/features/dashboard/types/dashboard-overview.types'
import { createEmptyDashboardOverview } from '@/features/dashboard/utils/dashboard-overview.utils'
import { useAuth } from '@/features/auth/hooks/useAuth'

type UseDashboardOverviewResult = {
  data: DashboardOverviewData
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardOverview(uid: string | null | undefined): UseDashboardOverviewResult {
  const { appUser } = useAuth()
  const normalizedUid = uid?.trim() ?? ''
  const [data, setData] = useState<DashboardOverviewData>(() =>
    createEmptyDashboardOverview(appUser, normalizedUid),
  )
  const [loading, setLoading] = useState(Boolean(normalizedUid))
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!normalizedUid) {
      setData(createEmptyDashboardOverview(appUser, ''))
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const nextData = await dashboardOverviewService.loadDashboardOverview(normalizedUid, appUser)
      setData(nextData)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar el resumen del dashboard.',
      )
      setData(createEmptyDashboardOverview(appUser, normalizedUid))
    } finally {
      setLoading(false)
    }
  }, [appUser, normalizedUid])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!normalizedUid) {
        if (!cancelled) {
          setData(createEmptyDashboardOverview(appUser, ''))
          setLoading(false)
          setError(null)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const nextData = await dashboardOverviewService.loadDashboardOverview(normalizedUid, appUser)

        if (!cancelled) {
          setData(nextData)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar el resumen del dashboard.',
          )
          setData(createEmptyDashboardOverview(appUser, normalizedUid))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [appUser, normalizedUid])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
