import { Award, CalendarCheck, ClipboardList, Users } from 'lucide-react'
import { calculateContactKpis } from '@/features/contacts/utils/contactKpis'
import type { Contact } from '@/features/contacts/types/contact.types'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'

const DEMO_KPIS: DashboardKpi[] = [
  {
    label: 'Tareas de hoy',
    value: '7',
    detail: 'Pendientes por completar',
    trend: 'neutral',
    icon: CalendarCheck,
    source: 'demo',
  },
  {
    label: 'Avance del plan',
    value: '68%',
    detail: 'Sigue así 🚀',
    trend: 'neutral',
    icon: Award,
    showProgressRing: true,
    source: 'demo',
  },
]

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
    ...DEMO_KPIS,
  ]
}
