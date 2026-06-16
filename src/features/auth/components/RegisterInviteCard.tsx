import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type RegisterInviteCardProps = {
  loading: boolean
  isValid: boolean
  hasInviteParam: boolean
  teamName?: string
  message: string
  className?: string
}

export function RegisterInviteCard({
  loading,
  isValid,
  hasInviteParam,
  teamName,
  message,
  className,
}: RegisterInviteCardProps) {
  if (!hasInviteParam) {
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
          <Loader2 className="h-4 w-4 animate-spin text-teal-accent" aria-hidden="true" />
          Validando invitación...
        </p>
      </div>
    )
  }

  if (isValid && teamName) {
    return (
      <div
        className={cn(
          'rounded-xl border border-teal-accent/30 bg-teal-accent/10 px-4 py-4',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-hero-text">Invitación activa</p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/80">{message}</p>
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
          <p className="text-sm font-semibold text-hero-text">Invitación no válida</p>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/80">{message}</p>
          <p className="mt-2 text-xs leading-relaxed text-hero-text/65">
            Puedes continuar y crear tu cuenta sin unirte a un grupo.
          </p>
        </div>
      </div>
    </div>
  )
}
