import { ArrowRight, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '@/components/ui'
import type { DashboardModule } from '@/features/dashboard/types/dashboard.types'
import { cn } from '@/lib/utils'

type ModuleCardProps = {
  module: DashboardModule
  locked?: boolean
}

export function ModuleCard({ module, locked = false }: ModuleCardProps) {
  const Icon = module.icon

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border border-white/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-transform duration-200',
        locked ? 'opacity-90' : 'hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-gold">0{module.number}</span>
        {locked ? (
          <Badge
            variant="gold"
            className="border border-gold/30 bg-gold/10 text-[11px] text-gold-light"
          >
            Requiere Activación de grupo
          </Badge>
        ) : null}
      </div>

      <div
        className={cn(
          'mx-auto my-5 flex h-16 w-16 items-center justify-center rounded-2xl',
          locked ? 'bg-hero-text/8 text-hero-text/45' : 'bg-teal-accent/12 text-teal-accent',
        )}
      >
        {locked ? (
          <Lock className="h-8 w-8" aria-hidden="true" />
        ) : (
          <Icon className="h-8 w-8" aria-hidden="true" />
        )}
      </div>

      <h3 className="text-center text-lg font-semibold text-text-dark">{module.title}</h3>
      <p className="mt-1 flex-1 text-center text-sm leading-relaxed text-text-soft">
        {locked
          ? 'Activa tu grupo para acceder a este módulo.'
          : module.subtitle}
      </p>

      {locked ? (
        <Link to={module.to} className="mt-6 block">
          <Button
            variant="outline"
            className="h-10 w-full border-petrol-dark/15 bg-hero-text/5 text-text-soft hover:bg-hero-text/10"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Bloqueado
          </Button>
        </Link>
      ) : (
        <Link to={module.to} className="mt-6 block">
          <Button
            variant="secondary"
            className="h-10 w-full bg-petrol-deep text-hero-text hover:bg-petrol-dark"
          >
            Entrar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      )}
    </article>
  )
}
