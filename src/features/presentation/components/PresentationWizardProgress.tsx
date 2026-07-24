import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { PresentationEditorStep } from '@/features/presentation/constants/presentationEditorSteps'
import { PRESENTATION_EDITOR_STEP_COUNT } from '@/features/presentation/constants/presentationEditorSteps'
import { cn } from '@/lib/utils'

type PresentationWizardProgressProps = {
  steps: PresentationEditorStep[]
  currentStepIndex: number
  onStepSelect: (index: number) => void
  disabled?: boolean
}

export function PresentationWizardProgress({
  steps,
  currentStepIndex,
  onStepSelect,
  disabled = false,
}: PresentationWizardProgressProps) {
  const currentStep = steps[currentStepIndex]
  const progressPercent = ((currentStepIndex + 1) / PRESENTATION_EDITOR_STEP_COUNT) * 100

  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const mobileList = mobileScrollRef.current
    const mobileActive = mobileList?.querySelector<HTMLElement>('[data-mobile-step-active="true"]')
    mobileActive?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })

    const desktopList = desktopScrollRef.current
    const desktopActive = desktopList?.querySelector<HTMLElement>('[data-step-active="true"]')
    desktopActive?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentStepIndex])

  return (
    <>
      {/* ── Mobile ─────────────────────────────────────────────── */}
      <section
        className={cn(
          'sm:hidden',
          'rounded-[20px] border border-teal-accent/35 bg-petrol-deep/70 p-4',
          'shadow-[0_8px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl',
        )}
        aria-label="Progreso del editor de presentación"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/55">
            Paso {currentStepIndex + 1} de {PRESENTATION_EDITOR_STEP_COUNT}
          </p>
          <p className="text-sm font-semibold text-gold">{Math.round(progressPercent)}%</p>
        </div>

        <div className="mt-3 min-w-0">
          <h2 className="text-[17px] font-semibold leading-snug text-hero-text">
            <span aria-hidden="true" className="mr-1.5">
              {currentStep?.emoji}
            </span>
            {currentStep?.label}
          </h2>
          {currentStep?.description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-hero-text/65">
              {currentStep.description}
            </p>
          ) : null}
        </div>

        <div
          className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/12"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del editor"
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div
          ref={mobileScrollRef}
          className="mt-3.5 overflow-x-auto overscroll-x-contain scrollbar-hide"
        >
          <ol className="flex w-max items-start gap-2.5">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex

              return (
                <li key={step.id} className="flex w-10 flex-col items-center gap-1.5">
                  <button
                    type="button"
                    disabled={disabled}
                    data-mobile-step-active={isActive ? 'true' : undefined}
                    onClick={() => onStepSelect(index)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200',
                      isActive &&
                        'border-gold bg-gold/10 text-gold shadow-[0_0_12px_rgba(217,164,65,0.35)]',
                      isCompleted &&
                        !isActive &&
                        'border-teal-accent/40 bg-teal-accent/10 text-teal-accent',
                      !isActive &&
                        !isCompleted &&
                        'border-white/18 bg-white/[0.04] text-hero-text/55',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={`${index + 1}. ${step.label}`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span
                    className={cn(
                      'h-0.5 w-4 rounded-full transition-opacity duration-200',
                      isActive ? 'bg-gold opacity-100' : 'opacity-0',
                    )}
                    aria-hidden="true"
                  />
                </li>
              )
            })}
          </ol>
        </div>

        <p className="mt-1 text-center text-[11px] font-medium tracking-wide text-hero-text/45">
          Desliza →
        </p>
      </section>

      {/* ── Desktop (sin cambios de diseño) ─────────────────────── */}
      <section
        className="hidden rounded-2xl border border-white/10 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:block"
        aria-label="Progreso del editor de presentación"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-hero-text/55">
              Paso {currentStepIndex + 1} de {PRESENTATION_EDITOR_STEP_COUNT}
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-hero-text">
              <span aria-hidden="true" className="mr-1.5">
                {currentStep?.emoji}
              </span>
              {currentStep?.label}
            </h2>
            {currentStep?.description ? (
              <p className="mt-1 text-sm text-hero-text/70">{currentStep.description}</p>
            ) : null}
          </div>
          <p className="shrink-0 pt-0.5 text-sm font-medium text-gold-light">
            {Math.round(progressPercent)}%
          </p>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del editor"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-accent to-gold transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4">
          <ol
            ref={desktopScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex

              return (
                <li key={step.id} className="shrink-0">
                  <button
                    type="button"
                    disabled={disabled}
                    data-step-active={isActive ? 'true' : undefined}
                    onClick={() => onStepSelect(index)}
                    className={cn(
                      'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-gold/40 bg-gold/15 text-gold-light'
                        : isCompleted
                          ? 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/15'
                          : 'border-white/10 bg-white/5 text-hero-text/60 hover:bg-white/10 hover:text-hero-text',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={step.label}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{step.emoji}</span>
                    )}
                    {step.shortLabel}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </>
  )
}
