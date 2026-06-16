import { Activity, Clock3, ShieldCheck, Users } from 'lucide-react'
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader'
import { adminGlassCardClassName } from '@/features/admin/constants/adminNavItems'

const adminUserCards = [
  {
    title: 'Usuarios registrados',
    description: 'Consulta y administra las cuentas activas del sistema.',
    icon: Users,
  },
  {
    title: 'Cuentas pendientes',
    description: 'Revisa cuentas en verificación o pendientes de activación.',
    icon: Clock3,
  },
  {
    title: 'Prospectos totales',
    description: 'Vista general del volumen de prospectos en la plataforma.',
    icon: ShieldCheck,
  },
  {
    title: 'Estado del sistema',
    description: 'Monitorea la salud general y configuración de EXPANSIÓN.',
    icon: Activity,
  },
] as const

export function AdminUsersPage() {
  return (
    <div className="px-8 py-8">
      <AdminPageHeader
        title="Usuarios"
        subtitle="Consulta cuentas, estados y actividad general de los usuarios."
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Resumen de usuarios">
        {adminUserCards.map(({ title, description, icon: Icon }) => (
          <article key={title} className={adminGlassCardClassName}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-hero-text">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/70">{description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
