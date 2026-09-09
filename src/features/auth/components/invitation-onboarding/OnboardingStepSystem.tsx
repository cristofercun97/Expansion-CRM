import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  Presentation,
  Radar,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SYSTEM_BLOCKS = [
  {
    id: 'capta',
    number: '01',
    title: 'CAPTA',
    subtitle: 'Encuentra y organiza oportunidades',
    icon: Presentation,
    accent: 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent',
    points: [
      'Crea tu presentación o página',
      'Organiza tus contactos',
      'Identifica a quién dar seguimiento',
    ],
    modules: 'Presentación · Landing · Contactos · Radar',
  },
  {
    id: 'aprende',
    number: '02',
    title: 'APRENDE',
    subtitle: 'Desarrolla tus conocimientos',
    icon: BookOpenCheck,
    accent: 'border-gold/30 bg-gold/10 text-gold-light',
    points: [
      'Accede a tu Academia',
      'Aprende a tu ritmo',
      'Mira cuánto has avanzado',
    ],
    modules: 'Academia · Progreso',
  },
  {
    id: 'actua',
    number: '03',
    title: 'ACTÚA',
    subtitle: 'Convierte tus metas en pasos reales',
    icon: Target,
    accent: 'border-white/15 bg-white/[0.05] text-hero-text',
    points: [
      'Define lo que quieres lograr',
      'Crea actividades',
      'Mide tu progreso',
    ],
    modules: 'Objetivos · Actividades · Progreso · Reconocimiento',
  },
] as const

const FLOW = ['CAPTA', 'APRENDE', 'ACTÚA', 'PROGRESA'] as const

type OnboardingStepSystemProps = {
  titleId: string
}

export function OnboardingStepSystem({ titleId }: OnboardingStepSystemProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2
          id={titleId}
          className="text-balance text-[1.35rem] font-semibold leading-snug text-hero-text sm:text-[1.55rem]"
        >
          Un sistema para ayudarte a crecer paso a paso
        </h2>
        <p className="flex items-center gap-2 text-sm text-hero-text/65">
          <Compass className="h-4 w-4 text-gold-light" aria-hidden="true" />
          Tres sistemas conectados. Un solo camino.
        </p>
      </div>

      <div className="grid gap-3">
        {SYSTEM_BLOCKS.map((block, index) => {
          const Icon = block.icon

          return (
            <div key={block.id} className="relative">
              {index < SYSTEM_BLOCKS.length - 1 ? (
                <div
                  className="absolute left-6 top-full z-0 hidden h-3 w-px bg-gradient-to-b from-gold/40 to-transparent sm:block"
                  aria-hidden="true"
                />
              ) : null}

              <article
                className={cn(
                  'relative z-10 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-4',
                  'shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                      block.accent,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-light">
                      {block.number} — {block.title}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-hero-text">{block.subtitle}</h3>
                    <ul className="mt-2.5 space-y-1.5">
                      {block.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-xs leading-relaxed text-hero-text/75 sm:text-sm"
                        >
                          <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent/80" aria-hidden="true" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2.5 text-[11px] tracking-wide text-hero-text/45">
                      {block.modules}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 via-white/[0.03] to-teal-accent/10 px-4 py-3.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-hero-text/85 sm:text-xs">
          {FLOW.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <span>{item}</span>
              {index < FLOW.length - 1 ? (
                <ArrowRight className="h-3 w-3 text-gold-light" aria-hidden="true" />
              ) : null}
            </span>
          ))}
        </div>
        <p className="text-sm font-medium text-gold-light">
          EXPANSIÓN te ayuda a saber qué hacer después.
        </p>
      </div>
    </div>
  )
}
