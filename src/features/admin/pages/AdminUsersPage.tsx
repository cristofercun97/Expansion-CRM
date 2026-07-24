import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader'
import { AdminUsersPanel } from '@/features/admin/components/AdminUsersPanel'

export function AdminUsersPage() {
  return (
    <div className="px-8 py-8">
      <AdminPageHeader
        title="Usuarios"
        subtitle="Consulta todas las cuentas registradas en Expansión."
      />

      <section className="mt-8" aria-label="Listado de usuarios">
        <AdminUsersPanel />
      </section>
    </div>
  )
}
