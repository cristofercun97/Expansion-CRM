import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader'
import { AdminActivationRequestsPanel } from '@/features/group-activation/components/AdminActivationRequestsPanel'

export function AdminActivationPage() {
  return (
    <div className="px-8 py-8">
      <AdminPageHeader
        title="Activación"
        subtitle="Revisa y gestiona las solicitudes de Activación de grupo."
      />

      <section className="mt-10" aria-label="Solicitudes de activación">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-xl font-semibold text-hero-text">Solicitudes de activación</h2>
          <div className="h-0.5 max-w-[120px] flex-1 rounded-full bg-gold" aria-hidden="true" />
        </div>
        <AdminActivationRequestsPanel />
      </section>
    </div>
  )
}
