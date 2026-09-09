import {
  CalendarDays,
  MessageSquare,
  StickyNote,
  Target,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SCATTERED_ITEMS = [
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    className: 'left-[6%] top-[8%] -rotate-6',
    delay: '0ms',
  },
  {
    id: 'notes',
    label: 'Notas',
    icon: StickyNote,
    className: 'right-[8%] top-[4%] rotate-8',
    delay: '80ms',
  },
  {
    id: 'contacts',
    label: 'Contactos',
    icon: Users,
    className: 'left-[10%] bottom-[12%] rotate-3',
    delay: '140ms',
  },
  {
    id: 'calendar',
    label: 'Agenda',
    icon: CalendarDays,
    className: 'right-[6%] bottom-[18%] -rotate-8',
    delay: '200ms',
  },
  {
    id: 'goals',
    label: 'Objetivos',
    icon: Target,
    className: 'left-1/2 top-[42%] -translate-x-1/2 rotate-2',
    delay: '260ms',
  },
] as const

const PAIN_POINTS = [
  'Contactos y conversaciones por todas partes',
  'Seguimientos que tienes que recordar de memoria',
  'Objetivos que quieres alcanzar, pero sin un camino claro',
] as const

type OnboardingStepProblemProps = {
  titleId: string
}

export function OnboardingStepProblem({ titleId }: OnboardingStepProblemProps) {
  return (
    <div className="space-y-5">
      <h2
        id={titleId}
        className="text-balance text-[1.35rem] font-semibold leading-snug text-hero-text sm:text-[1.55rem]"
      >
        ¿Sientes que tienes muchas cosas por hacer… pero no siempre sabes por dónde empezar?
      </h2>

      <div
        className={cn(
          'relative mx-auto h-[168px] w-full max-w-[360px] overflow-hidden rounded-2xl',
          'border border-white/10 bg-gradient-to-br from-white/[0.07] via-petrol-deep/40 to-teal-accent/10',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(217,164,65,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(106,197,188,0.12),transparent_40%)]" />

        {SCATTERED_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.id} className={cn('absolute', item.className)}>
              <div
                className="motion-safe:animate-[onboarding-float_4.8s_ease-in-out_infinite]"
                style={{ animationDelay: item.delay }}
              >
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border border-white/15 bg-petrol-deep/80 px-2.5 py-1.5',
                    'text-[11px] font-medium text-hero-text/85 shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-gold-light" />
                  <span>{item.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ul className="space-y-2.5">
        {PAIN_POINTS.map((point) => (
          <li
            key={point}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm leading-relaxed text-hero-text/80"
          >
            {point}
          </li>
        ))}
      </ul>

      <p className="rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm font-medium leading-relaxed text-gold-light">
        No necesitas trabajar más.
        <br />
        Necesitas trabajar con más claridad.
      </p>
    </div>
  )
}
