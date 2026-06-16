import { EmptyState, PageHeader } from '@/components/ui'

export function LeaderHomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel de usuario"
        title="Tu espacio de crecimiento"
        subtitle="Aquí verás tu avance, prospectos y herramientas para duplicar tu sistema."
      />
      <EmptyState
        title="Panel en construcción"
        description="Tu sesión está activa. Pronto podrás gestionar prospectos, landing y tareas desde aquí."
      />
    </div>
  )
}
