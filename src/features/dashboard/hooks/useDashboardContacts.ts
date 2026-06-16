import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth.service'
import { contactsService } from '@/features/contacts/services/contacts.service'
import type { Contact } from '@/features/contacts/types/contact.types'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'
import { buildDashboardKpis } from '@/features/dashboard/utils/buildDashboardKpis'
import { logDashboardDevError } from '@/features/dashboard/utils/logDashboardDevError'

type UseDashboardContactsResult = {
  kpis: DashboardKpi[]
  loading: boolean
}

export function useDashboardContacts(): UseDashboardContactsResult {
  const { currentUser, initialized, loading: authLoading } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const uid = currentUser?.uid

  const loadContacts = useCallback(async (ownerUid: string, user: NonNullable<typeof currentUser>) => {
    setLoading(true)

    try {
      await authService.ensureFreshAuthToken(user)
      const results = await contactsService.getContactsByOwner(ownerUid)
      setContacts(results)
    } catch (error) {
      logDashboardDevError('[Dashboard] Error al cargar prospectos', error)
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    if (!uid) {
      setContacts([])
      setLoading(false)
      return
    }

    void loadContacts(uid, currentUser)
  }, [authLoading, currentUser, initialized, loadContacts, uid])

  const kpis = useMemo(() => buildDashboardKpis(contacts), [contacts])

  return {
    kpis,
    loading: !initialized || authLoading || loading,
  }
}
