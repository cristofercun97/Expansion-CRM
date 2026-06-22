import { Loader2, Sparkles, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useGroupActivation } from '@/features/group-activation/hooks/useGroupActivation'
import { ReferralProgramSection } from '@/features/referrals/components/ReferralProgramSection'
import { formatExpansionAnnualPriceLabel } from '@/features/referrals/constants/referralProgram.constants'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type ActivateOwnedOrganizationCardProps = {
  className?: string
}

export function ActivateOwnedOrganizationCard({ className }: ActivateOwnedOrganizationCardProps) {
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
    return null
  }

  if (activationStatus === 'pending') {
    return (
      <section
        className={cn(
          'rounded-2xl border border-gold/30 bg-gold/10 p-5 backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
          <div>
            <h3 className="text-base font-semibold text-hero-text">{MY_GROUP_COPY.activateTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
              Solicitud en revisión. Te avisaremos cuando tu organización esté lista para activarse.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section
        className={cn(
          'rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
            <UserPlus className="h-5 w-5 text-teal-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-hero-text">{MY_GROUP_COPY.activateTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">
              {MY_GROUP_COPY.activateDescription}
            </p>
            <p className="mt-3 text-sm font-semibold text-gold-light">
              {formatExpansionAnnualPriceLabel()}
            </p>
            <Button
              type="button"
              className="mt-4 bg-gold text-petrol-deep hover:bg-gold-light"
              disabled={submitting}
              onClick={() => void handleRequestActivation()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando solicitud...
                </>
              ) : (
                MY_GROUP_COPY.activateCta
              )}
            </Button>
          </div>
        </div>
      </section>

      <ReferralProgramSection className="mt-5" />
    </>
  )
}
