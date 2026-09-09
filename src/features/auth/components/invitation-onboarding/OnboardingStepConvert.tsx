import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const JOURNEY = ['Presenta', 'Contacta', 'Aprende', 'Actúa', 'Mide'] as const

type OnboardingStepConvertProps = {
  titleId: string
  eyebrow?: string | null
}

export function OnboardingStepConvert({ titleId, eyebrow }: OnboardingStepConvertProps) {
  return (
    <div className="space-y-5">
      {eyebrow ? (
        <p className="rounded-full border border-teal-accent/25 bg-teal-accent/10 px-3 py-1.5 text-center text-xs font-medium text-teal-accent">
          {eyebrow}
        </p>
      ) : null}

      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold-light">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>

        <h2
          id={titleId}
          className="text-balance text-[1.4rem] font-semibold leading-snug text-hero-text sm:text-[1.6rem]"
        >
          Tu crecimiento puede empezar hoy
        </h2>

        <div className="space-y-1.5 text-sm leading-relaxed text-hero-text/75">
          <p>No necesitas aprender todo ahora.</p>
          <p>Empieza con algo sencillo.</p>
          <p>Crea tu cuenta, conoce EXPANSIÓN y avanza paso a paso.</p>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10',
          'bg-white/[0.04] px-3 py-3 text-[11px] font-medium text-hero-text/80 sm:text-xs',
        )}
      >
        {JOURNEY.map((item, index) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            <span>{item}</span>
            {index < JOURNEY.length - 1 ? (
              <ArrowRight className="h-3 w-3 text-teal-accent" aria-hidden="true" />
            ) : null}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/15 via-white/[0.03] to-teal-accent/10 px-4 py-4 text-center">
        <p className="text-lg font-semibold leading-snug text-hero-text sm:text-xl">
          Construye tu progreso.
          <br />
          Multiplica tus resultados.
        </p>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-hero-text/55">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-accent" aria-hidden="true" />
        Registro sencillo · Empieza en pocos minutos
      </p>
    </div>
  )
}
