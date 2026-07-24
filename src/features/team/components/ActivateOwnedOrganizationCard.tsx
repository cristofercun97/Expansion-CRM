import { Sparkles, UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { ActivationRequestForm } from '@/features/group-activation/components/ActivationRequestForm'
import { useGroupActivation } from '@/features/group-activation/hooks/useGroupActivation'
import type { RequestGroupActivationInput } from '@/features/group-activation/types/group-activation.types'
import { ReferralProgramSection } from '@/features/referrals/components/ReferralProgramSection'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'
import { cn } from '@/lib/utils'

type ActivateOwnedOrganizationCardProps = {
  className?: string
}

export function ActivateOwnedOrganizationCard({ className }: ActivateOwnedOrganizationCardProps) {
  const { showToast } = useToast()
  const { activationStatus, requestActivation, submitting } = useGroupActivation()

  async function handleRequestActivation(input: RequestGroupActivationInput) {
    try {
      await requestActivation(input)
      showToast('Solicitud enviada. El equipo revisará tu activación.', 'success')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'
      showToast(message, 'info')
      throw error
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
          </div>
        </div>

        <ActivationRequestForm
          className="mt-5"
          submitting={submitting}
          submitLabel={MY_GROUP_COPY.activateCta}
          onSubmit={handleRequestActivation}
        />
      </section>

      <ReferralProgramSection className="mt-5" />
    </>
  )
}
