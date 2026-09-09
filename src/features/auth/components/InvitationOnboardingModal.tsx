import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import logo from '@/assets/logo.png'
import { Button } from '@/components/ui'
import { OnboardingProgressNav } from '@/features/auth/components/invitation-onboarding/OnboardingProgressNav'
import { OnboardingStepClarity } from '@/features/auth/components/invitation-onboarding/OnboardingStepClarity'
import { OnboardingStepConvert } from '@/features/auth/components/invitation-onboarding/OnboardingStepConvert'
import { OnboardingStepProblem } from '@/features/auth/components/invitation-onboarding/OnboardingStepProblem'
import { OnboardingStepSystem } from '@/features/auth/components/invitation-onboarding/OnboardingStepSystem'
import type {
  InvitationOnboardingStep,
  InvitationOnboardingType,
} from '@/features/auth/types/invitationOnboarding.types'
import {
  getInvitationOnboardingEyebrow,
  getInvitationOnboardingStepMeta,
} from '@/features/auth/utils/invitationOnboardingContent'
import { cn } from '@/lib/utils'

type InvitationOnboardingModalProps = {
  open: boolean
  type: InvitationOnboardingType
  teamName?: string
  onComplete: () => void
  onSkip: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

const TOTAL_STEPS = 4

export function InvitationOnboardingModal({
  open,
  type,
  teamName,
  onComplete,
  onSkip,
}: InvitationOnboardingModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const [step, setStep] = useState<InvitationOnboardingStep>(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [contentKey, setContentKey] = useState(0)

  const meta = getInvitationOnboardingStepMeta({ type, teamName }, step)
  const eyebrow = getInvitationOnboardingEyebrow(type, teamName)

  useEffect(() => {
    if (!open) {
      return
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimeout = window.setTimeout(() => {
      const primaryButton = dialogRef.current?.querySelector<HTMLElement>(
        '[data-onboarding-primary="true"]',
      )
      primaryButton?.focus()
    }, 30)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimeout)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus?.()
    }
  }, [onSkip, open])

  function goToStep(nextStep: InvitationOnboardingStep, nextDirection: 'forward' | 'back') {
    setDirection(nextDirection)
    setStep(nextStep)
    setContentKey((value) => value + 1)
  }

  function handlePrimary() {
    if (step < TOTAL_STEPS) {
      goToStep((step + 1) as InvitationOnboardingStep, 'forward')
      return
    }

    onComplete()
  }

  function handleBack() {
    if (step <= 1) {
      return
    }

    goToStep((step - 1) as InvitationOnboardingStep, 'back')
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] min-h-[100dvh]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,47,54,0.55),rgba(0,0,0,0.72))] backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="relative flex h-full min-h-[100dvh] items-end justify-center p-3 sm:items-center sm:p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'relative z-10 flex max-h-[min(94dvh,820px)] w-full max-w-[440px] flex-col overflow-hidden sm:max-w-[520px]',
            'rounded-[28px] border border-white/12 bg-petrol-deep',
            'shadow-[0_30px_90px_rgba(0,0,0,0.5),0_0_0_1px_rgba(217,164,65,0.08)]',
          )}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-teal-accent/12 blur-3xl" />
            <div className="absolute -right-10 top-24 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-teal-accent/8 blur-3xl" />
          </div>

          <div className="relative shrink-0 border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
            <div className="flex items-center justify-between gap-3">
              <img
                src={logo}
                alt="Expansión"
                className="h-11 w-auto object-contain sm:h-12"
              />
              <p className="text-[11px] font-medium tracking-[0.14em] text-hero-text/45 sm:text-xs">
                SISTEMA DE CRECIMIENTO
              </p>
            </div>

            <OnboardingProgressNav step={step} />
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div
              key={contentKey}
              className={cn(
                'motion-reduce:transform-none motion-reduce:opacity-100',
                direction === 'forward'
                  ? 'animate-[onboarding-forward_320ms_ease-out]'
                  : 'animate-[onboarding-back_320ms_ease-out]',
              )}
            >
              {step === 1 ? <OnboardingStepProblem titleId={titleId} /> : null}
              {step === 2 ? <OnboardingStepClarity titleId={titleId} /> : null}
              {step === 3 ? <OnboardingStepSystem titleId={titleId} /> : null}
              {step === 4 ? (
                <OnboardingStepConvert titleId={titleId} eyebrow={eyebrow} />
              ) : null}
            </div>
          </div>

          <div className="relative shrink-0 space-y-2 border-t border-white/10 bg-petrol-deep/90 px-5 py-4 backdrop-blur-sm sm:px-7">
            <Button
              type="button"
              size="lg"
              data-onboarding-primary="true"
              className="h-12 w-full bg-gold text-petrol-deep hover:bg-gold-light"
              onClick={handlePrimary}
            >
              {meta.primaryLabel}
            </Button>

            <div className="flex items-center justify-between gap-3">
              {meta.showBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="min-h-11 rounded-lg px-2 text-sm font-medium text-hero-text/70 transition-colors hover:text-hero-text"
                >
                  ← Volver
                </button>
              ) : (
                <span />
              )}

              {meta.showSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-11 rounded-lg px-2 text-sm font-medium text-hero-text/50 transition-colors hover:text-hero-text/80"
                >
                  Ahora no
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboarding-forward {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes onboarding-back {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes onboarding-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes onboarding-soft-in {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-\\[onboarding-forward_320ms_ease-out\\],
          .animate-\\[onboarding-back_320ms_ease-out\\],
          .motion-safe\\:animate-\\[onboarding-float_4\\.8s_ease-in-out_infinite\\],
          .motion-safe\\:animate-\\[onboarding-soft-in_420ms_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
