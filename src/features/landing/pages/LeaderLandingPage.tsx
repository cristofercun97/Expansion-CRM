import { EmptyState, PageHeader } from '@/components/ui'

export function LeaderLandingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Landing personalizada" subtitle="Configura tu página pública de captación." />
      <EmptyState title="Landing en construcción" description="Pronto podrás editar tu landing desde aquí." />
    </div>
  )
}
