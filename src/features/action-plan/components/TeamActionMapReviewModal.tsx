import { Loader2, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button, Input, Textarea } from '@/components/ui'
import type {
  CreateTeamActionMapReviewInput,
  TeamActionMapReviewWeeklyStatus,
} from '@/features/action-plan/types/team-action-map-review.types'
import {
  buildReviewTextFromChips,
  DEFAULT_WEEKLY_REVIEW_FORM,
  getWeeklyReviewStatusDefaults,
  hasWeeklyReviewFormErrors,
  resolveWeeklyReviewWeekLabel,
  validateWeeklyReviewForm,
  WEEKLY_REVIEW_ADJUSTMENT_CHIPS,
  WEEKLY_REVIEW_ADJUSTMENTS_IDEA,
  WEEKLY_REVIEW_BLOCKER_CHIPS,
  WEEKLY_REVIEW_BLOCKERS_IDEA,
  WEEKLY_REVIEW_PROGRESS_CHIPS,
  WEEKLY_REVIEW_PROGRESS_IDEA,
  WEEKLY_REVIEW_STATUS_OPTIONS,
  type WeeklyReviewChip,
  type WeeklyReviewFormErrors,
  type WeeklyReviewFormValues,
  type WeeklyReviewStatusDefaults,
} from '@/features/action-plan/utils/teamActionMapReviewUtils'
import { cn } from '@/lib/utils'

type TeamActionMapReviewModalProps = {
  open: boolean
  isSubmitting: boolean
  teamId: string
  ownerUid: string
  onClose: () => void
  onSubmit: (input: CreateTeamActionMapReviewInput) => Promise<void>
}

const fieldClassName =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-[#4C5C60] focus:border-gold/40'

const inputClassName = `${fieldClassName} !text-white`

const dateInputClassName = (hasValue: boolean) =>
  `${fieldClassName} ${hasValue ? '!text-white' : '!text-[#4C5C60]'}`

const textareaClassName = cn(inputClassName, 'min-h-[72px] resize-y text-sm leading-relaxed')

function IdeaButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-xs font-medium text-gold-light transition-colors hover:text-gold disabled:opacity-50"
    >
      Usar idea
    </button>
  )
}

function QuickSelectChips({
  chips,
  selectedIds,
  disabled,
  onToggle,
}: {
  chips: WeeklyReviewChip[]
  selectedIds: string[]
  disabled: boolean
  onToggle: (chipId: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isSelected = selectedIds.includes(chip.id)

        return (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(chip.id)}
            aria-pressed={isSelected}
            className={cn(
              'rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors',
              isSelected
                ? 'border-gold/40 bg-gold/15 text-gold-light'
                : 'border-white/15 bg-white/5 text-hero-text/75 hover:border-white/25 hover:bg-white/8',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}

function GuidedTextBlock({
  title,
  chips,
  selectedChipIds,
  textareaId,
  value,
  fieldError,
  disabled,
  onToggleChip,
  onChange,
  onUseIdea,
}: {
  title: string
  chips: WeeklyReviewChip[]
  selectedChipIds: string[]
  textareaId: string
  value: string
  fieldError?: string
  disabled: boolean
  onToggleChip: (chipId: string) => void
  onChange: (value: string) => void
  onUseIdea: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-hero-text">{title}</h3>
        <IdeaButton disabled={disabled} onClick={onUseIdea} />
      </div>

      <QuickSelectChips
        chips={chips}
        selectedIds={selectedChipIds}
        disabled={disabled}
        onToggle={onToggleChip}
      />

      <div className="mt-3">
        <label htmlFor={textareaId} className="mb-1.5 block text-xs text-hero-text/55">
          Texto generado, puedes ajustarlo si quieres
        </label>
        <Textarea
          id={textareaId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={2}
          maxLength={2000}
          className={textareaClassName}
        />
        {fieldError ? <p className="mt-1.5 text-xs text-red-200">{fieldError}</p> : null}
      </div>
    </div>
  )
}

export function TeamActionMapReviewModal({
  open,
  isSubmitting,
  teamId,
  ownerUid,
  onClose,
  onSubmit,
}: TeamActionMapReviewModalProps) {
  const [values, setValues] = useState<WeeklyReviewFormValues>(DEFAULT_WEEKLY_REVIEW_FORM)
  const [fieldErrors, setFieldErrors] = useState<WeeklyReviewFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [selectedProgressChips, setSelectedProgressChips] = useState<string[]>([])
  const [selectedBlockerChips, setSelectedBlockerChips] = useState<string[]>([])
  const [selectedAdjustmentChips, setSelectedAdjustmentChips] = useState<string[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(DEFAULT_WEEKLY_REVIEW_FORM)
    setFieldErrors({})
    setSubmitError('')
    setSelectedProgressChips([])
    setSelectedBlockerChips([])
    setSelectedAdjustmentChips([])

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  function applyStatusDefaults(status: TeamActionMapReviewWeeklyStatus) {
    const defaults = getWeeklyReviewStatusDefaults(status)

    setSelectedProgressChips([])
    setSelectedBlockerChips([])
    setSelectedAdjustmentChips([])
    setValues((current) => ({
      ...current,
      weeklyStatus: status,
      progressSummary: defaults.progressSummary,
      blockers: defaults.blockers,
      nextAdjustments: defaults.nextAdjustments,
    }))
  }

  function resolveFieldText(
    chipText: string,
    status: WeeklyReviewFormValues['weeklyStatus'],
    field: keyof WeeklyReviewStatusDefaults,
  ): string {
    if (chipText) {
      return chipText
    }

    if (status) {
      return getWeeklyReviewStatusDefaults(status)[field]
    }

    return ''
  }

  function toggleProgressChip(chipId: string) {
    const nextSelected = selectedProgressChips.includes(chipId)
      ? selectedProgressChips.filter((id) => id !== chipId)
      : [...selectedProgressChips, chipId]
    const chipText = buildReviewTextFromChips(WEEKLY_REVIEW_PROGRESS_CHIPS, nextSelected)

    setSelectedProgressChips(nextSelected)
    setValues((current) => ({
      ...current,
      progressSummary: resolveFieldText(chipText, current.weeklyStatus, 'progressSummary'),
    }))
  }

  function toggleBlockerChip(chipId: string) {
    const nextSelected = selectedBlockerChips.includes(chipId)
      ? selectedBlockerChips.filter((id) => id !== chipId)
      : [...selectedBlockerChips, chipId]
    const chipText = buildReviewTextFromChips(WEEKLY_REVIEW_BLOCKER_CHIPS, nextSelected)

    setSelectedBlockerChips(nextSelected)
    setValues((current) => ({
      ...current,
      blockers: resolveFieldText(chipText, current.weeklyStatus, 'blockers'),
    }))
  }

  function toggleAdjustmentChip(chipId: string) {
    const nextSelected = selectedAdjustmentChips.includes(chipId)
      ? selectedAdjustmentChips.filter((id) => id !== chipId)
      : [...selectedAdjustmentChips, chipId]
    const chipText = buildReviewTextFromChips(WEEKLY_REVIEW_ADJUSTMENT_CHIPS, nextSelected)

    setSelectedAdjustmentChips(nextSelected)
    setValues((current) => ({
      ...current,
      nextAdjustments: resolveFieldText(chipText, current.weeklyStatus, 'nextAdjustments'),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateWeeklyReviewForm(values)

    if (hasWeeklyReviewFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit({
        teamId,
        roadmapId: teamId,
        ownerUid,
        weekLabel: resolveWeeklyReviewWeekLabel(values.weekLabel),
        weekStartDate: values.weekStartDate.trim() || null,
        weekEndDate: values.weekEndDate.trim() || null,
        progressSummary: values.progressSummary.trim(),
        blockers: values.blockers.trim(),
        nextAdjustments: values.nextAdjustments.trim(),
        weeklyStatus: values.weeklyStatus as CreateTeamActionMapReviewInput['weeklyStatus'],
      })
      onClose()
    } catch {
      setSubmitError('No pudimos guardar la revisión semanal. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-action-map-review-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-petrol-deep/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-3xl"
      >
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-gold-light/80">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-[0.14em]">Mapa de ruta</p>
              </div>
              <h2 id="team-action-map-review-title" className="mt-1 text-xl font-semibold text-hero-text">
                Revisión rápida de la semana
              </h2>
              <p className="mt-2 text-sm text-hero-text/70">
                Elige lo que mejor describe tu semana. Nosotros te ayudamos a convertirlo en una
                revisión clara para tu equipo.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-hero-text/50">
                No tiene que ser perfecto. Solo captura el aprendizaje de la semana.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:space-y-5 sm:px-6 sm:py-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-hero-text">Estado de la semana</legend>
              <p className="mb-3 text-xs text-hero-text/55">
                La revisión ayuda a que tu equipo no pierda dirección.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {WEEKLY_REVIEW_STATUS_OPTIONS.map((option) => {
                  const isSelected = values.weeklyStatus === option.value

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'cursor-pointer rounded-2xl border p-3.5 transition-colors sm:p-4',
                        isSelected
                          ? 'border-gold/35 bg-gold/10 shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                          : 'border-white/10 bg-white/5 hover:border-white/20',
                        isSubmitting && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <input
                        type="radio"
                        name="weeklyStatus"
                        value={option.value}
                        checked={isSelected}
                        disabled={isSubmitting}
                        onChange={() => applyStatusDefaults(option.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-3 w-3 shrink-0 rounded-full',
                            option.value === 'green' && 'bg-teal-accent',
                            option.value === 'yellow' && 'bg-gold',
                            option.value === 'red' && 'bg-red-400',
                          )}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-hero-text">{option.label}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-hero-text/65">
                        {option.description}
                      </p>
                    </label>
                  )
                })}
              </div>
              {fieldErrors.weeklyStatus ? (
                <p className="mt-1.5 text-xs text-red-200">{fieldErrors.weeklyStatus}</p>
              ) : null}
            </fieldset>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-hero-text/45">
                Periodo revisado
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="review-week-label" className="mb-1.5 block text-xs text-hero-text/60">
                    Semana
                  </label>
                  <Input
                    id="review-week-label"
                    value={values.weekLabel}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, weekLabel: event.target.value }))
                    }
                    disabled={isSubmitting}
                    maxLength={200}
                    placeholder="Semana actual"
                    className={inputClassName}
                  />
                  {fieldErrors.weekLabel ? (
                    <p className="mt-1.5 text-xs text-red-200">{fieldErrors.weekLabel}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="review-week-start"
                      className="mb-1.5 block text-xs text-hero-text/60"
                    >
                      Fecha inicio <span className="text-hero-text/40">(opcional)</span>
                    </label>
                    <Input
                      id="review-week-start"
                      type="date"
                      value={values.weekStartDate}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, weekStartDate: event.target.value }))
                      }
                      disabled={isSubmitting}
                      className={dateInputClassName(Boolean(values.weekStartDate))}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="review-week-end"
                      className="mb-1.5 block text-xs text-hero-text/60"
                    >
                      Fecha cierre <span className="text-hero-text/40">(opcional)</span>
                    </label>
                    <Input
                      id="review-week-end"
                      type="date"
                      value={values.weekEndDate}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, weekEndDate: event.target.value }))
                      }
                      disabled={isSubmitting}
                      className={dateInputClassName(Boolean(values.weekEndDate))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <GuidedTextBlock
              title="¿Qué avanzó?"
              chips={WEEKLY_REVIEW_PROGRESS_CHIPS}
              selectedChipIds={selectedProgressChips}
              textareaId="review-progress"
              value={values.progressSummary}
              fieldError={fieldErrors.progressSummary}
              disabled={isSubmitting}
              onToggleChip={toggleProgressChip}
              onChange={(progressSummary) =>
                setValues((current) => ({ ...current, progressSummary }))
              }
              onUseIdea={() => {
                setSelectedProgressChips([])
                setValues((current) => ({ ...current, progressSummary: WEEKLY_REVIEW_PROGRESS_IDEA }))
              }}
            />

            <GuidedTextBlock
              title="¿Qué está bloqueado?"
              chips={WEEKLY_REVIEW_BLOCKER_CHIPS}
              selectedChipIds={selectedBlockerChips}
              textareaId="review-blockers"
              value={values.blockers}
              fieldError={fieldErrors.blockers}
              disabled={isSubmitting}
              onToggleChip={toggleBlockerChip}
              onChange={(blockers) => setValues((current) => ({ ...current, blockers }))}
              onUseIdea={() => {
                setSelectedBlockerChips([])
                setValues((current) => ({ ...current, blockers: WEEKLY_REVIEW_BLOCKERS_IDEA }))
              }}
            />

            <div>
              <p className="mb-3 text-xs leading-relaxed text-hero-text/50">
                Un ajuste pequeño puede cambiar el ritmo del grupo.
              </p>
              <GuidedTextBlock
                title="¿Qué ajustaremos?"
                chips={WEEKLY_REVIEW_ADJUSTMENT_CHIPS}
                selectedChipIds={selectedAdjustmentChips}
                textareaId="review-adjustments"
                value={values.nextAdjustments}
                fieldError={fieldErrors.nextAdjustments}
                disabled={isSubmitting}
                onToggleChip={toggleAdjustmentChip}
                onChange={(nextAdjustments) =>
                  setValues((current) => ({ ...current, nextAdjustments }))
                }
                onUseIdea={() => {
                  setSelectedAdjustmentChips([])
                  setValues((current) => ({
                    ...current,
                    nextAdjustments: WEEKLY_REVIEW_ADJUSTMENTS_IDEA,
                  }))
                }}
              />
            </div>

            {submitError ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-white/15 bg-white/5 text-hero-text hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Guardar revisión'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
