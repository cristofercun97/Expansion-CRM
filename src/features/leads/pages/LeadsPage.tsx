import { EmptyState, PageHeader } from '@/components/ui'

export function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Prospectos" subtitle="Gestiona tus leads y su avance." />
      <EmptyState title="CRM en construcción" description="Aquí podrás ver y gestionar tus prospectos." />
    </div>
  )
}
