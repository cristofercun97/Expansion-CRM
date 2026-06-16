import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useGroupActivation } from '@/features/group-activation/hooks/useGroupActivation'
import { cn } from '@/lib/utils'

type TeamActivationCardProps = {
  className?: string
}

/**
 * ⚠️ UI CRÍTICA — única entrada del usuario para solicitar Activación de grupo (upgrade).
 * Conectada a useGroupActivation → groupActivationService.requestGroupActivation().
 */
export function TeamActivationCard({ className }: TeamActivationCardProps) {
  const { showToast } = useToast()
  const { activationStatus, requestActivation, submitting } = useGroupActivation()

  async function handleRequestActivation() {
    try {
      await requestActivation()
      showToast('Solicitud enviada. El equipo revisará tu activación.', 'success')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'
      showToast(message, 'info')
    }
  }

  if (activationStatus === 'active') {
    return (
      <section
        className={cn(
          'rounded-2xl border border-teal-accent/30 bg-teal-accent/10 p-5 backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
          <div>
            <h3 className="text-base font-semibold text-hero-text">Grupo activado</h3>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
              Tu organización está activa. Puedes invitar miembros, usar tus módulos completos y
              compartir tu enlace de invitación.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (activationStatus === 'pending') {
    return (
      <section
        className={cn(
          'rounded-2xl border border-gold/30 bg-gold/10 p-5 backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <h3 className="text-base font-semibold text-hero-text">Activación de grupo</h3>
        <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
          Solicitud en revisión. El equipo revisará tu activación y te avisaremos cuando esté
          lista.
        </p>
        <p className="mt-3 text-sm font-medium text-gold-light">Solicitud en revisión</p>
      </section>
    )
  }

  if (activationStatus === 'rejected') {
    return (
      <section
        className={cn(
          'rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <h3 className="text-base font-semibold text-hero-text">Activación de grupo</h3>
        <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
          Tu solicitud fue rechazada. Puedes contactar con soporte o volver a solicitar.
        </p>
        <p className="mt-3 text-sm font-semibold text-gold-light">120€ / año</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={handleRequestActivation}
          className="mt-4 border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enviando solicitud...
            </>
          ) : (
            'Solicitar activación'
          )}
        </Button>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-hero-text">Activación de grupo</h3>
      <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
        Para crear tu propia organización, activar tus módulos completos y tener tu propio enlace
        de invitación, debes solicitar la Activación de grupo.
      </p>
      <p className="mt-3 text-sm font-semibold text-gold-light">120€ / año</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={submitting}
        onClick={handleRequestActivation}
        className="mt-4 border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando solicitud...
          </>
        ) : (
          'Solicitar activación'
        )}
      </Button>
    </section>
  )
}
