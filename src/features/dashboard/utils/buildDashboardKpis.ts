import { ClipboardList, Users } from 'lucide-react'
import { calculateContactKpis } from '@/features/contacts/utils/contactKpis'
import type { Contact } from '@/features/contacts/types/contact.types'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'

export function buildDashboardKpis(contacts: Contact[]): DashboardKpi[] {
  const { total, following } = calculateContactKpis(contacts)

  return [
    {
      label: 'Personas interesadas',
      value: String(total),
      detail: 'Contactos registrados',
      trend: 'neutral',
      icon: Users,
      source: 'live',
    },
    {
      label: 'Seguimientos',
      value: String(following),
      detail: 'En seguimiento activo',
      trend: 'neutral',
      icon: ClipboardList,
      source: 'live',
    },
  ]
}
