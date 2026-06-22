import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type RegisterRecommendationCardProps = {
  loading: boolean
  isValid: boolean
  hasRefParam: boolean
  message?: string
  className?: string
}

export function RegisterRecommendationCard({
  loading,
  isValid,
  hasRefParam,
  message,
  className,
}: RegisterRecommendationCardProps) {
  if (!hasRefParam) {
    return null
  }

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-hero-text/75',
          className,
        )}
      >
        <p className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gold-light" aria-hidden="true" />
          Validando recomendación...
        </p>
      </div>
    )
  }

  if (isValid) {
    return (
      <div
        className={cn(
          'rounded-xl border border-gold/30 bg-gold/10 px-4 py-4',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-hero-text">Recomendación activa</p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/80">
              Te registras por recomendación comercial. No entrarás automáticamente al grupo operativo
              del recomendador.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-hero-text">Recomendación no válida</p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/80">
            {message ?? 'Este código de recomendación no es válido.'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-hero-text/65">
            Puedes continuar y crear tu cuenta sin enlace de recomendación.
          </p>
        </div>
      </div>
    </div>
  )
}
