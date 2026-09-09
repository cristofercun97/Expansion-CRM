import {
  BookOpen,
  CalendarCheck2,
  ChartNoAxesCombined,
  Target,
  Users,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

const ORBIT_ITEMS = [
  {
    id: 'contacts',
    label: 'Tus contactos',
    icon: Users,
    className: 'left-[4%] top-[10%]',
  },
  {
    id: 'followups',
    label: 'Tus seguimientos',
    icon: CalendarCheck2,
    className: 'right-[2%] top-[8%]',
  },
  {
    id: 'learning',
    label: 'Tu formación',
    icon: BookOpen,
    className: 'left-[2%] bottom-[14%]',
  },
  {
    id: 'goals',
    label: 'Tus objetivos',
    icon: Target,
    className: 'right-[4%] bottom-[12%]',
  },
  {
    id: 'progress',
    label: 'Tu progreso',
    icon: ChartNoAxesCombined,
    className: 'left-1/2 top-[72%] -translate-x-1/2',
  },
] as const

type OnboardingStepClarityProps = {
  titleId: string
}

export function OnboardingStepClarity({ titleId }: OnboardingStepClarityProps) {
  return (
    <div className="space-y-5">
      <h2
        id={titleId}
        className="text-balance text-[1.35rem] font-semibold leading-snug text-hero-text sm:text-[1.55rem]"
      >
        Imagina tener claro qué hacer después.
      </h2>

      <div
        className={cn(
          'relative mx-auto h-[210px] w-full max-w-[380px] overflow-hidden rounded-2xl',
          'border border-white/10 bg-gradient-to-br from-teal-accent/10 via-petrol-deep/50 to-gold/10',
        )}
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-[38%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/20 bg-gold/5 blur-0" />
        <div className="absolute left-1/2 top-[38%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-accent/25 bg-petrol-deep/90 p-2 shadow-[0_0_40px_rgba(106,197,188,0.18)]">
          <img src={logo} alt="" className="h-full w-full object-contain" />
        </div>

        {ORBIT_ITEMS.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              className={cn(
                'absolute flex items-center gap-1.5 rounded-full border border-teal-accent/25 bg-petrol-deep/85 px-2.5 py-1.5',
                'text-[11px] font-medium text-hero-text shadow-[0_10px_28px_rgba(0,0,0,0.28)]',
                'motion-safe:animate-[onboarding-soft-in_420ms_ease-out]',
                item.className,
              )}
            >
              <Icon className="h-3.5 w-3.5 text-teal-accent" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>

      <div className="space-y-2 text-center">
        <p className="text-base font-semibold text-hero-text">Todo conectado en un mismo lugar.</p>
        <p className="text-sm font-medium tracking-wide text-gold-light">
          Más orden. Más claridad. Más dirección.
        </p>
      </div>
    </div>
  )
}
