import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function ActionPlanBlockedState() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/8 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold-light">
          <Users className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-hero-text">Aún no perteneces a un grupo</h2>
          <p className="mt-3 text-sm leading-relaxed text-hero-text/75 sm:text-base">
            Solicita la Activación de grupo para crear tu propio plan o únete mediante una
            invitación.
          </p>
          <Link to="/dashboard/mi-grupo" className="mt-5 inline-block">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 !text-white hover:bg-white/10 hover:!text-white"
            >
              Ir a Mi grupo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
