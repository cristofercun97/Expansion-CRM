import { Award } from 'lucide-react'
import { DashboardPlaceholderPage } from '@/features/dashboard/components/DashboardPlaceholderPage'

export function ReconocimientosDashboardPage() {
  return (
    <DashboardPlaceholderPage
      title="Reconocimientos"
      subtitle="Celebra tus logros y avances"
      icon={Award}
    />
  )
}
