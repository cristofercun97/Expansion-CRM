import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

type AcademyProgressBlockedPageProps = {
  className?: string
}

export function AcademyProgressBlockedPage({ className }: AcademyProgressBlockedPageProps) {
  return (
    <div className={cn('px-4 py-8 sm:px-8 sm:py-10', className)}>
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/8 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold-light">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-hero-text sm:text-2xl">
              Progreso de Academia
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-hero-text/75 sm:text-base">
              Necesitas activar tu grupo para ver el progreso académico de tu equipo.
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
