import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import logo from '@/assets/logo.png'
import { Button } from '@/components/ui'
import type {
  InvitationOnboardingStep,
  InvitationOnboardingType,
} from '@/features/auth/types/invitationOnboarding.types'
import { buildInvitationOnboardingSteps } from '@/features/auth/utils/invitationOnboardingContent'
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

  const steps = useMemo(
    () => buildInvitationOnboardingSteps({ type, teamName }),
    [teamName, type],
  )
  const content = steps[step]

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
    if (step < 3) {
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative flex h-full min-h-[100dvh] items-end justify-center p-3 sm:items-center sm:p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden',
            'rounded-2xl border border-white/15 bg-petrol-deep shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
          )}
        >
          <div className="shrink-0 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <img
                src={logo}
                alt="Expansión"
                className="h-9 w-auto object-contain sm:h-10"
              />
              <p className="text-xs font-medium tracking-wide text-hero-text/55">
                Paso {step} de 3
              </p>
            </div>

            <div
              className="mt-4 flex items-center justify-center gap-2"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={step}
              aria-label={`Paso ${step} de 3`}
            >
              {([1, 2, 3] as const).map((dot) => (
                <span
                  key={dot}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full transition-colors duration-200',
                    dot === step ? 'scale-110 bg-gold' : 'bg-white/25',
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-teal-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div
              key={contentKey}
              className={cn(
                'motion-reduce:transform-none motion-reduce:opacity-100',
                direction === 'forward'
                  ? 'animate-[onboarding-forward_280ms_ease-out]'
                  : 'animate-[onboarding-back_280ms_ease-out]',
              )}
            >
              <h2
                id={titleId}
                className="text-xl font-semibold leading-snug text-hero-text sm:text-[1.35rem]"
              >
                {content.title}
              </h2>

              {content.paragraphs?.length ? (
                <div className="mt-4 space-y-3">
                  {content.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-relaxed text-hero-text/80 sm:text-[0.95rem]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}

              {content.benefits?.length ? (
                <ul className="mt-5 space-y-3">
                  {content.benefits.map((benefit) => (
                    <li
                      key={`${benefit.emoji}-${benefit.title}`}
                      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3"
                    >
                      <span className="text-lg leading-none" aria-hidden="true">
                        {benefit.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-hero-text">{benefit.title}</p>
                        {benefit.description ? (
                          <p className="mt-1 text-xs leading-relaxed text-hero-text/70 sm:text-sm">
                            {benefit.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {content.closingParagraphs?.length ? (
                <div className="mt-4 space-y-2">
                  {content.closingParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm font-medium leading-relaxed text-gold-light"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-white/10 px-5 py-4 sm:px-6">
            <Button
              type="button"
              size="lg"
              data-onboarding-primary="true"
              className="h-11 w-full bg-gold text-petrol-deep hover:bg-gold-light"
              onClick={handlePrimary}
            >
              {content.primaryLabel}
            </Button>

            <div className="flex items-center justify-between gap-3">
              {content.showBack ? (
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

              {content.showSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-11 rounded-lg px-2 text-sm font-medium text-hero-text/55 transition-colors hover:text-hero-text/80"
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
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes onboarding-back {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-\\[onboarding-forward_280ms_ease-out\\],
          .animate-\\[onboarding-back_280ms_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
