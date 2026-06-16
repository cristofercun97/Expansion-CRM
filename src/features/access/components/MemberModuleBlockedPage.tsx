import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { canAccessGroupContent } from '@/features/access/utils/canAccessGroupContent'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/lib/utils'

type MemberModuleBlockedPageProps = {
  className?: string
}

export function MemberModuleBlockedPage({ className }: MemberModuleBlockedPageProps) {
  const { appUser } = useAuth()
  const hasGroupContentAccess = canAccessGroupContent(appUser)

  return (
    <div className={cn('px-4 py-8 sm:px-8 sm:py-10', className)}>
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/8 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold-light">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-hero-text sm:text-2xl">
              Módulo disponible con Activación de grupo
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-hero-text/75 sm:text-base">
              Para crear tu propio grupo y acceder a Presentación, Radar de Interés y Contactos,
              debes solicitar la Activación de grupo.
            </p>
            {hasGroupContentAccess ? (
              <p className="mt-3 text-sm leading-relaxed text-hero-text/70">
                Mientras tanto, puedes seguir usando la Academia, el Plan de Acción y el enlace de
                invitación del grupo al que perteneces.
              </p>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-gold-light">Activación anual: 120€</p>
            <Link to="/dashboard/mi-grupo" className="mt-5 inline-block">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
              >
                Solicitar activación
              </Button>
            </Link>
            <p className="mt-2 text-xs text-white/80">
              Puedes solicitar tu activación desde la sección Mi grupo.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex text-sm font-medium text-teal-accent transition-colors hover:text-gold-light"
            >
              Volver al panel principal
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
