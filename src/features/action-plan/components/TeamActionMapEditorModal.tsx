import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  LayoutGrid,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Badge, Button, Input, Textarea } from '@/components/ui'
import type {
  TeamActionMap,
  TeamMapPeriodType,
  TeamMapStatus,
  UpsertTeamActionMapInput,
} from '@/features/action-plan/types/team-action-map.types'
import {
  DEFAULT_MAIN_OBJECTIVE_TEMPLATE,
  DEFAULT_VISION_TEMPLATE,
  formatTeamMapDateRange,
  getSuggestedAreaTemplate,
  getTeamMapPeriodLabel,
  getTeamMapStatusBadgeClassName,
  getTeamMapStatusLabel,
  getTeamMapStatusShortLabel,
  LEGACY_MAIN_OBJECTIVE_FALLBACK,
  MAX_TEAM_MAP_AREAS,
  SUGGESTED_TEAM_MAP_AREAS,
  TEAM_MAP_PERIOD_OPTIONS,
  TEAM_MAP_STATUS_OPTIONS,
} from '@/features/action-plan/utils/teamActionMapUtils'
import { cn } from '@/lib/utils'

type TeamActionMapEditorModalProps = {
  open: boolean
  isSubmitting: boolean
  existingMap: TeamActionMap | null
  onClose: () => void
  onSubmit: (input: UpsertTeamActionMapInput) => Promise<void>
}

type AreaDraft = {
  id?: string
  title: string
  description?: string
  objective: string
  indicator: string
  status: TeamMapStatus
}

function createEmptyAreaDraft(title = ''): AreaDraft {
  return {
    title,
    description: '',
    objective: '',
    indicator: '',
    status: 'yellow',
  }
}

const WIZARD_STEPS = [
  { title: 'El norte del equipo', icon: Compass },
  { title: 'Objetivo del periodo', icon: Target },
  { title: 'Áreas de enfoque', icon: LayoutGrid },
  { title: 'Activar ruta', icon: Rocket },
] as const

const fieldClassName =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-[#4C5C60] focus:border-gold/40'

const inputClassName = `${fieldClassName} !text-white`

const dateInputClassName = (hasValue: boolean) =>
  `${fieldClassName} ${hasValue ? '!text-white' : '!text-[#4C5C60]'}`

const selectClassName =
  'h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm !text-white outline-none focus:border-gold/40 disabled:cursor-not-allowed disabled:opacity-60'

function normalizeTitle(title: string): string {
  return title.trim() || 'Mapa de ruta del grupo'
}

function normalizeAreas(areas: AreaDraft[]) {
  return areas
    .map((area, index) => ({
      id: area.id,
      title: area.title.trim(),
      description: area.description?.trim() ?? '',
      objective: area.objective.trim(),
      indicator: area.indicator.trim(),
      status: area.status,
      order: index,
    }))
    .filter((area) => area.title.length >= 2)
}

export function TeamActionMapEditorModal({
  open,
  isSubmitting,
  existingMap,
  onClose,
  onSubmit,
}: TeamActionMapEditorModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [vision, setVision] = useState('')
  const [mainObjective, setMainObjective] = useState('')
  const [periodType, setPeriodType] = useState<TeamMapPeriodType>('90_days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<TeamMapStatus>('yellow')
  const [areas, setAreas] = useState<AreaDraft[]>([])
  const [expandedAreaIndexes, setExpandedAreaIndexes] = useState<number[]>([])
  const [stepError, setStepError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const isEditing = Boolean(existingMap)
  const activeAreas = useMemo(() => normalizeAreas(areas), [areas])
  const dateRangeLabel = formatTeamMapDateRange(startDate || null, endDate || null)

  useEffect(() => {
    if (!open) {
      return
    }

    setCurrentStep(1)
    setTitle(existingMap?.title ?? '')
    setVision(existingMap?.vision ?? '')
    setMainObjective(
      existingMap?.mainObjective === LEGACY_MAIN_OBJECTIVE_FALLBACK
        ? ''
        : (existingMap?.mainObjective ?? ''),
    )
    setPeriodType(existingMap?.periodType ?? '90_days')
    setStartDate(existingMap?.startDate ?? '')
    setEndDate(existingMap?.endDate ?? '')
    setStatus(existingMap?.status ?? 'yellow')
    setAreas(
      existingMap?.areas.map((area) => ({
        id: area.id,
        title: area.title,
        description: area.description ?? '',
        objective: area.objective ?? '',
        indicator: area.indicator ?? '',
        status: area.status ?? 'yellow',
      })) ?? [],
    )
    setExpandedAreaIndexes([])
    setStepError('')
    setSubmitError('')

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
  }, [existingMap, isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (normalizeTitle(title).length < 3) {
        return 'El nombre de la ruta necesita al menos 3 caracteres.'
      }

      if (vision.trim().length < 10) {
        return 'Comparte una visión breve para orientar a tu equipo (mínimo 10 caracteres).'
      }

      return null
    }

    if (step === 2) {
      if (mainObjective.trim().length < 10) {
        return 'Define un objetivo concreto para este periodo (mínimo 10 caracteres).'
      }

      if (!periodType) {
        return 'Elige un periodo para tu ruta.'
      }

      if (startDate && endDate && startDate > endDate) {
        return 'La fecha de cierre debe ser posterior a la de inicio.'
      }

      return null
    }

    if (step === 3) {
      if (areas.length > MAX_TEAM_MAP_AREAS) {
        return `Puedes tener hasta ${MAX_TEAM_MAP_AREAS} áreas en el mapa.`
      }

      return null
    }

    return null
  }

  function validateAllSteps(): string | null {
    for (let step = 1; step <= 2; step += 1) {
      const error = validateStep(step)

      if (error) {
        return error
      }
    }

    return validateStep(3)
  }

  function handleNextStep() {
    const error = validateStep(currentStep)

    if (error) {
      setStepError(error)
      return
    }

    setStepError('')
    setCurrentStep((current) => Math.min(current + 1, WIZARD_STEPS.length))
  }

  function handlePreviousStep() {
    setStepError('')
    setCurrentStep((current) => Math.max(current - 1, 1))
  }

  function isSuggestedAreaSelected(suggestedTitle: string): boolean {
    return areas.some(
      (area) => area.title.trim().toLowerCase() === suggestedTitle.toLowerCase(),
    )
  }

  function toggleSuggestedArea(suggestedTitle: string) {
    if (isSuggestedAreaSelected(suggestedTitle)) {
      setAreas((current) =>
        current.filter(
          (area) => area.title.trim().toLowerCase() !== suggestedTitle.toLowerCase(),
        ),
      )
      return
    }

    if (areas.length >= MAX_TEAM_MAP_AREAS) {
      setStepError(`Puedes agregar hasta ${MAX_TEAM_MAP_AREAS} áreas.`)
      return
    }

    setStepError('')
    setAreas((current) => [...current, createEmptyAreaDraft(suggestedTitle)])
    setExpandedAreaIndexes((current) => [...current, areas.length])
  }

  function handleAddCustomArea() {
    if (areas.length >= MAX_TEAM_MAP_AREAS) {
      setStepError(`Puedes agregar hasta ${MAX_TEAM_MAP_AREAS} áreas.`)
      return
    }

    setStepError('')
    const nextIndex = areas.length
    setAreas((current) => [...current, createEmptyAreaDraft()])
    setExpandedAreaIndexes((current) => [...current, nextIndex])
  }

  function updateAreaField(index: number, patch: Partial<AreaDraft>) {
    setAreas((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  function applyAreaGuide(index: number) {
    const area = areas[index]
    const template = getSuggestedAreaTemplate(area.title)

    if (!template) {
      return
    }

    updateAreaField(index, {
      objective: template.objective,
      indicator: template.indicator,
    })
  }

  function toggleAreaExpanded(index: number) {
    setExpandedAreaIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )
  }

  function isAreaExpanded(index: number): boolean {
    return expandedAreaIndexes.includes(index)
  }

  function handleRemoveArea(index: number) {
    setAreas((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setExpandedAreaIndexes((current) =>
      current
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item)),
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const validationError = validateAllSteps()

    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setSubmitError('')

    try {
      await onSubmit({
        title: normalizeTitle(title),
        description: existingMap?.description,
        vision: vision.trim(),
        mainObjective: mainObjective.trim(),
        periodType,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        areas: activeAreas,
      })
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No pudimos guardar el mapa. Inténtalo de nuevo.',
      )
    }
  }

  const stepMeta = WIZARD_STEPS[currentStep - 1]
  const StepIcon = stepMeta.icon

  return createPortal(
    <div className="fixed inset-0 z-50 min-h-[100dvh]">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar editor"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div className="relative flex h-full min-h-[100dvh] items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-action-map-editor-title"
          className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
        >
          <div className="flex shrink-0 flex-col gap-4 border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-light/80">
                  {isEditing ? 'Editar ruta' : 'Nueva ruta'}
                </p>
                <h2 id="team-action-map-editor-title" className="mt-1 text-xl font-semibold text-hero-text">
                  Construye la ruta de tu equipo
                </h2>
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

            <div className="space-y-2">
              <div className="flex gap-2">
                {WIZARD_STEPS.map((step, index) => {
                  const stepNumber = index + 1
                  const isActive = stepNumber === currentStep
                  const isComplete = stepNumber < currentStep

                  return (
                    <div
                      key={step.title}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        isActive || isComplete ? 'bg-gold' : 'bg-white/12',
                      )}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-hero-text/60">
                <span>
                  Paso {currentStep} de {WIZARD_STEPS.length}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <StepIcon className="h-3.5 w-3.5 text-gold-light" aria-hidden="true" />
                  {stepMeta.title}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {currentStep === 1 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                        <Compass className="h-5 w-5 text-gold-light" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-hero-text">
                          Define el norte de tu equipo
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
                          Toda ruta empieza con una dirección clara. Escribe qué quieres construir
                          con tu grupo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="map-title" className="mb-1.5 block text-sm font-medium text-hero-text">
                      Nombre de la ruta
                    </label>
                    <Input
                      id="map-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={isSubmitting}
                      maxLength={120}
                      placeholder="Mapa de ruta del grupo"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="map-vision" className="text-sm font-medium text-hero-text">
                        Visión
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setVision(DEFAULT_VISION_TEMPLATE)}
                        className="text-xs font-medium text-gold-light transition-colors hover:text-gold"
                      >
                        Usar idea
                      </button>
                    </div>
                    <Textarea
                      id="map-vision"
                      value={vision}
                      onChange={(event) => setVision(event.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                      maxLength={300}
                      className={inputClassName}
                      placeholder="¿Hacia dónde quieres llevar a tu equipo?"
                    />
                  </div>

                  <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-hero-text/65">
                    No tiene que ser perfecto. Solo necesitamos una dirección para empezar.
                  </p>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                        <Target className="h-5 w-5 text-gold-light" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-hero-text">
                          Elige el resultado que quieres lograr
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
                          Ahora transformemos tu visión en un objetivo concreto para este periodo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="map-main-objective" className="text-sm font-medium text-hero-text">
                        Objetivo principal
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setMainObjective(DEFAULT_MAIN_OBJECTIVE_TEMPLATE)}
                        className="text-xs font-medium text-gold-light transition-colors hover:text-gold"
                      >
                        Usar idea
                      </button>
                    </div>
                    <Textarea
                      id="map-main-objective"
                      value={mainObjective}
                      onChange={(event) => setMainObjective(event.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                      maxLength={500}
                      className={inputClassName}
                      placeholder="¿Qué quieres que tu equipo logre en este periodo?"
                    />
                  </div>

                  <div>
                    <label htmlFor="map-period" className="mb-1.5 block text-sm font-medium text-hero-text">
                      Periodo
                    </label>
                    <select
                      id="map-period"
                      value={periodType}
                      onChange={(event) => setPeriodType(event.target.value as TeamMapPeriodType)}
                      disabled={isSubmitting}
                      className={selectClassName}
                    >
                      {TEAM_MAP_PERIOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-petrol-deep">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="map-start-date"
                        className="mb-1.5 block text-sm font-medium text-hero-text"
                      >
                        Fecha de inicio
                      </label>
                      <Input
                        id="map-start-date"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        disabled={isSubmitting}
                        className={dateInputClassName(Boolean(startDate))}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="map-end-date"
                        className="mb-1.5 block text-sm font-medium text-hero-text"
                      >
                        Fecha de cierre
                      </label>
                      <Input
                        id="map-end-date"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        disabled={isSubmitting}
                        className={dateInputClassName(Boolean(endDate))}
                      />
                    </div>
                  </div>

                  <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-hero-text/65">
                    Un buen objetivo no presiona, enfoca.
                  </p>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                        <LayoutGrid className="h-5 w-5 text-gold-light" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-hero-text">
                          Elige dónde pondrás la energía
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
                          Elige tus áreas de enfoque y define cómo sabrás si el equipo está
                          avanzando.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-hero-text">Áreas sugeridas</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TEAM_MAP_AREAS.map((suggestedTitle) => {
                        const selected = isSuggestedAreaSelected(suggestedTitle)

                        return (
                          <button
                            key={suggestedTitle}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => toggleSuggestedArea(suggestedTitle)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                              selected
                                ? 'border-gold/35 bg-gold/15 text-gold-light'
                                : 'border-white/15 bg-white/5 text-hero-text/80 hover:border-white/25 hover:bg-white/10',
                            )}
                          >
                            {selected ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                            )}
                            {suggestedTitle}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs text-hero-text/50">
                      Sugerencia: empieza con 3 a 5 áreas.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-hero-text">
                      Áreas seleccionadas ({areas.length}/{MAX_TEAM_MAP_AREAS})
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting || areas.length >= MAX_TEAM_MAP_AREAS}
                      onClick={handleAddCustomArea}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Área personalizada
                    </Button>
                  </div>

                  {areas.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-hero-text/65">
                      Elige al menos una área sugerida o crea una personalizada.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {areas.map((area, index) => {
                        const expanded = isAreaExpanded(index)
                        const template = getSuggestedAreaTemplate(area.title)
                        const areaTitle = area.title.trim() || `Área ${index + 1}`

                        return (
                          <div
                            key={area.id ?? `area-${index}-${area.title}`}
                            className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                          >
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => toggleAreaExpanded(index)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-hero-text">
                                  {areaTitle}
                                </p>
                                {!expanded && area.objective.trim() ? (
                                  <p className="mt-0.5 truncate text-xs text-hero-text/60">
                                    {area.objective.trim()}
                                  </p>
                                ) : null}
                              </div>
                              <Badge
                                className={cn(
                                  'shrink-0 border',
                                  getTeamMapStatusBadgeClassName(area.status),
                                )}
                              >
                                {getTeamMapStatusShortLabel(area.status)}
                              </Badge>
                              {expanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-hero-text/50" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-hero-text/50" aria-hidden="true" />
                              )}
                            </button>

                            {expanded ? (
                              <div className="space-y-3 border-t border-white/10 px-4 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-medium uppercase tracking-wide text-hero-text/55">
                                    Detalle del área
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {template ? (
                                      <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => applyAreaGuide(index)}
                                        className="text-xs font-medium text-gold-light transition-colors hover:text-gold"
                                      >
                                        Usar guía
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveArea(index)}
                                      disabled={isSubmitting}
                                      className="inline-flex items-center gap-1 text-xs text-red-200/80 transition-colors hover:text-red-200"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                      Quitar
                                    </button>
                                  </div>
                                </div>

                                {!template ? (
                                  <Input
                                    value={area.title}
                                    onChange={(event) =>
                                      updateAreaField(index, { title: event.target.value })
                                    }
                                    disabled={isSubmitting}
                                    maxLength={120}
                                    placeholder="Nombre del área"
                                    className={inputClassName}
                                  />
                                ) : null}

                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-hero-text/75">
                                    Objetivo del área
                                  </label>
                                  <Textarea
                                    value={area.objective}
                                    onChange={(event) =>
                                      updateAreaField(index, { objective: event.target.value })
                                    }
                                    disabled={isSubmitting}
                                    rows={2}
                                    maxLength={500}
                                    placeholder={
                                      template
                                        ? undefined
                                        : 'Ej: Mejorar la constancia del equipo en esta área.'
                                    }
                                    className={inputClassName}
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-hero-text/75">
                                    Indicador
                                  </label>
                                  <Textarea
                                    value={area.indicator}
                                    onChange={(event) =>
                                      updateAreaField(index, { indicator: event.target.value })
                                    }
                                    disabled={isSubmitting}
                                    rows={2}
                                    maxLength={500}
                                    placeholder={
                                      template
                                        ? undefined
                                        : 'Ej: Número de acciones completadas cada semana.'
                                    }
                                    className={inputClassName}
                                  />
                                </div>

                                <div>
                                  <p className="mb-2 text-xs font-medium text-hero-text/75">
                                    Estado inicial
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {TEAM_MAP_STATUS_OPTIONS.map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => updateAreaField(index, { status: option.value })}
                                        className={cn(
                                          'rounded-full border px-3 py-1 text-xs transition-colors',
                                          area.status === option.value
                                            ? getTeamMapStatusBadgeClassName(option.value)
                                            : 'border-white/15 bg-white/5 text-hero-text/70 hover:border-white/25',
                                        )}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-hero-text/65">
                    No necesitas medirlo todo. Elige indicadores simples que te ayuden a tomar
                    mejores decisiones.
                  </p>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                        <Rocket className="h-5 w-5 text-gold-light" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-hero-text">Tu ruta está lista</h3>
                        <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
                          Ya tienes una dirección clara para tu equipo. Ahora podrás convertir esta
                          ruta en acciones y revisar el avance semana a semana.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="map-status" className="mb-1.5 block text-sm font-medium text-hero-text">
                      Estado general
                    </label>
                    <select
                      id="map-status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as TeamMapStatus)}
                      disabled={isSubmitting}
                      className={selectClassName}
                    >
                      {TEAM_MAP_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-petrol-deep">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold-light" aria-hidden="true" />
                      <h4 className="text-sm font-semibold text-hero-text">Resumen de tu ruta</h4>
                    </div>

                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/50">Nombre</dt>
                        <dd className="mt-1 text-hero-text/90">{normalizeTitle(title)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/50">Visión</dt>
                        <dd className="mt-1 leading-relaxed text-hero-text/85">{vision.trim()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/50">
                          Objetivo principal
                        </dt>
                        <dd className="mt-1 leading-relaxed text-hero-text/85">
                          {mainObjective.trim()}
                        </dd>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-hero-text/50">
                            Periodo
                          </dt>
                          <dd className="mt-1 text-hero-text/85">
                            {getTeamMapPeriodLabel(periodType)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-hero-text/50">
                            Fechas
                          </dt>
                          <dd className="mt-1 text-hero-text/85">
                            {dateRangeLabel ?? 'Sin fechas definidas'}
                          </dd>
                        </div>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/50">Estado</dt>
                        <dd className="mt-1 text-hero-text/85">{getTeamMapStatusLabel(status)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/50">Áreas</dt>
                        <dd className="mt-2 space-y-2">
                          {activeAreas.length > 0 ? (
                            activeAreas.map((area) => (
                              <div
                                key={area.id ?? area.title}
                                className="rounded-xl border border-white/10 bg-white/8 px-3 py-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-hero-text/90">
                                    {area.title}
                                  </span>
                                  <Badge
                                    className={cn(
                                      'border',
                                      getTeamMapStatusBadgeClassName(area.status ?? 'yellow'),
                                    )}
                                  >
                                    {getTeamMapStatusShortLabel(area.status ?? 'yellow')}
                                  </Badge>
                                </div>
                                {area.objective ? (
                                  <p className="mt-1 text-xs leading-relaxed text-hero-text/65">
                                    {area.objective}
                                  </p>
                                ) : null}
                                {area.indicator ? (
                                  <p className="mt-1 text-xs text-hero-text/50">
                                    Indicador: {area.indicator}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <span className="text-hero-text/65">Sin áreas seleccionadas</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null}

              {stepError ? <p className="mt-4 text-sm text-red-200">{stepError}</p> : null}
              {submitError ? <p className="mt-4 text-sm text-red-200">{submitError}</p> : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 border-t border-white/10 px-6 py-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                >
                  Atrás
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}

              {currentStep < WIZARD_STEPS.length ? (
                <Button type="button" onClick={handleNextStep} disabled={isSubmitting} className="ml-auto">
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="ml-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Guardando...
                    </>
                  ) : isEditing ? (
                    'Actualizar Mapa de Ruta'
                  ) : (
                    'Guardar Mapa de Ruta'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
