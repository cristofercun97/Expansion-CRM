import { ONBOARDING_NARRATIVE_LABELS } from '@/features/auth/types/invitationOnboarding.types'
import type { InvitationOnboardingStep } from '@/features/auth/types/invitationOnboarding.types'
import { cn } from '@/lib/utils'

type OnboardingProgressNavProps = {
  step: InvitationOnboardingStep
}

export function OnboardingProgressNav({ step }: OnboardingProgressNavProps) {
  return (
    <div
      className="mt-4"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={step}
      aria-label={`Paso ${step} de 4`}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        {([1, 2, 3, 4] as const).map((index, position) => {
          const isActive = index === step
          const isComplete = index < step

          return (
            <div key={index} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  'shrink-0 text-[11px] font-semibold tracking-[0.14em] sm:text-xs',
                  isActive || isComplete ? 'text-gold-light' : 'text-hero-text/35',
                )}
              >
                {String(index).padStart(2, '0')}
              </span>

              {position < 3 ? (
                <span
                  className={cn(
                    'h-px min-w-0 flex-1 rounded-full transition-colors duration-300',
                    isComplete || isActive ? 'bg-gold/55' : 'bg-white/15',
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-center text-[10px] font-medium tracking-[0.18em] text-hero-text/45 sm:text-[11px]">
        {ONBOARDING_NARRATIVE_LABELS.map((label, index) => (
          <span key={label}>
            <span className={cn(index + 1 === step ? 'text-gold-light' : undefined)}>{label}</span>
            {index < ONBOARDING_NARRATIVE_LABELS.length - 1 ? (
              <span className="mx-1.5 text-hero-text/25" aria-hidden="true">
                —
              </span>
            ) : null}
          </span>
        ))}
      </p>
    </div>
  )
}
