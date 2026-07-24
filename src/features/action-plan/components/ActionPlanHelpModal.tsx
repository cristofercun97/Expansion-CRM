import { CircleHelp, Compass, Map, Target, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import type { ActionPlanSectionId } from '@/features/action-plan/components/ActionPlanFocusBar'
import { cn } from '@/lib/utils'

type ActionPlanHelpModalProps = {
  open: boolean
  isLeader: boolean
  initialSection: ActionPlanSectionId
  onClose: () => void
  onGoToSection?: (sectionId: ActionPlanSectionId) => void
}

type HelpModule = {
  id: ActionPlanSectionId
  label: string
  icon: typeof Target
  summary: string
  leaderPoints: string[]
  memberPoints: string[]
  tip: string
}

const HELP_MODULES: HelpModule[] = [
  {
    id: 'plan-ventas',
    label: 'Ventas',
    icon: Target,
    summary:
      'Aquí se define la meta comercial del grupo y se registra el avance con ventas reales.',
    leaderPoints: [
      'Configura una meta semanal o mensual para enfocar al equipo.',
      'Revisa y valida las ventas que reportan tus miembros.',
      'Consulta el historial para ver si se cumplió el periodo y cuánto aportó cada persona.',
    ],
    memberPoints: [
      'Mira la meta del grupo y cuánto falta por alcanzar.',
      'Reporta tus ventas para que el líder las valide.',
      'Tu avance validado suma al objetivo compartido.',
    ],
    tip: 'Solo cuentan las ventas validadas por el líder.',
  },
  {
    id: 'plan-mapa',
    label: 'Mapa',
    icon: Map,
    summary:
      'Es la brújula del grupo: hacia dónde van, en qué periodo y qué áreas necesitan atención.',
    leaderPoints: [
      'Crea o edita el mapa con el objetivo principal y las áreas clave.',
      'Publica una revisión semanal: qué avanzó, qué se bloqueó y qué se ajustará.',
      'Usa el semáforo de áreas para ver dónde el equipo necesita acompañamiento.',
    ],
    memberPoints: [
      'Consulta el rumbo del grupo y las áreas prioritarias.',
      'Lee la revisión semanal para saber qué se espera esta semana.',
      'Si aún no hay mapa o revisión, espera a que tu líder los publique.',
    ],
    tip: 'El mapa orienta; las tareas son lo que se ejecuta día a día.',
  },
  {
    id: 'plan-tareas',
    label: 'Tareas',
    icon: Compass,
    summary:
      'Son las acciones concretas del plan. Aquí se convierte la estrategia en avance medible.',
    leaderPoints: [
      'Crea tareas claras y, si puedes, enlázalas a un área del mapa.',
      'Revisa el cumplimiento del equipo en cada tarea.',
      'Actualiza también tu propio progreso para dar ejemplo.',
    ],
    memberPoints: [
      'Marca tu progreso: pendiente, en curso o completada.',
      'Prioriza las tareas que el líder publicó para esta etapa.',
      'Mantener tu estado al día ayuda al grupo a verse con claridad.',
    ],
    tip: 'Una tarea bien marcada vale más que muchas sin actualizar.',
  },
]

export function ActionPlanHelpModal({
  open,
  isLeader,
  initialSection,
  onClose,
  onGoToSection,
}: ActionPlanHelpModalProps) {
  const [activeHelpSection, setActiveHelpSection] =
    useState<ActionPlanSectionId>(initialSection)

  useEffect(() => {
    if (open) {
      setActiveHelpSection(initialSection)
    }
  }, [initialSection, open])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  const activeModule =
    HELP_MODULES.find((module) => module.id === activeHelpSection) ?? HELP_MODULES[0]
  const ActiveIcon = activeModule.icon
  const points = isLeader ? activeModule.leaderPoints : activeModule.memberPoints

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Cerrar ayuda del plan"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-plan-help-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-teal-accent" aria-hidden="true" />
              <h2
                id="action-plan-help-title"
                className="text-lg font-semibold text-hero-text sm:text-xl"
              >
                Guía rápida del Plan de Acción
              </h2>
            </div>
            <p className="mt-1 text-sm text-hero-text/70">
              Elige un módulo para entender qué hace y cómo usarlo
              {isLeader ? ' como líder' : ' como miembro'}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Módulos de ayuda">
            {HELP_MODULES.map((module) => {
              const Icon = module.icon
              const isActive = module.id === activeHelpSection

              return (
                <button
                  key={module.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveHelpSection(module.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                    isActive
                      ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                      : 'border-white/15 bg-white/5 text-hero-text/75 hover:bg-white/10 hover:text-hero-text',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {module.label}
                </button>
              )
            })}
          </div>

          <article className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
                <ActiveIcon className="h-5 w-5 text-teal-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-hero-text">{activeModule.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-hero-text/75">
                  {activeModule.summary}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">
                Cómo usarlo {isLeader ? '(líder)' : '(miembro)'}
              </p>
              <ul className="mt-2 space-y-2.5">
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2 text-sm leading-relaxed text-hero-text/80"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-light"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 rounded-xl border border-gold/20 bg-gold/8 px-4 py-3 text-sm text-hero-text/80">
              <span className="font-semibold text-gold-light">Tip: </span>
              {activeModule.tip}
            </p>
          </article>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4 sm:px-6">
          {onGoToSection ? (
            <Button
              type="button"
              className="bg-gold text-petrol-deep hover:bg-gold-light"
              onClick={() => {
                onGoToSection(activeModule.id)
                onClose()
              }}
            >
              Ir a {activeModule.label}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
