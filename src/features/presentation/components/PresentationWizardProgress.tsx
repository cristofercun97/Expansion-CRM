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

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/8 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-hero-text/55">
            Paso {currentStepIndex + 1} de {PRESENTATION_EDITOR_STEP_COUNT}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-hero-text">
            <span aria-hidden="true" className="mr-1.5">
              {currentStep?.emoji}
            </span>
            {currentStep?.label}
          </h2>
          {currentStep?.description ? (
            <p className="mt-1 text-sm text-hero-text/70">{currentStep.description}</p>
          ) : null}
        </div>
        <p className="text-sm font-medium text-gold-light">{Math.round(progressPercent)}%</p>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso del editor de presentación"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-accent to-gold transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <ol className="flex min-w-max gap-2 px-1">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex

            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onStepSelect(index)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-gold/40 bg-gold/15 text-gold-light'
                      : isCompleted
                        ? 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/15'
                        : 'border-white/10 bg-white/5 text-hero-text/60 hover:bg-white/10 hover:text-hero-text',
                    disabled && 'cursor-not-allowed opacity-60',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{step.emoji}</span>
                  )}
                  <span className="hidden sm:inline">{step.shortLabel}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
