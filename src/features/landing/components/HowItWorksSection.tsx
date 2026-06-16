import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  GraduationCap,
  MessageCircleMore,
  Network,
  Share2,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection } from '@/features/landing/components/LandingPrimitives'
import { cn } from '@/lib/utils'

type Step = {
  number: string
  shortTitle: string
  title: string
  description: string
  icon: LucideIcon
  mockup: ReactNode
}

function LandingMockup() {
  return (
    <div className="rounded-2xl border border-teal-accent/15 bg-linear-to-br from-teal-accent/5 to-white p-5">
      <p className="text-xs text-[#4A4A46]">expansion.app/l/cristian-tito</p>
      <h4 className="mt-3 text-lg font-semibold text-landing-text">Cristian Tito</h4>
      <p className="mt-1 text-sm text-[#4A4A46]">Construye tu crecimiento paso a paso</p>
      <div className="mt-5 rounded-xl bg-gold px-4 py-2.5 text-center text-sm font-medium text-hero-bg">
        Quiero información
      </div>
    </div>
  )
}

function FormMockup() {
  return (
    <div className="space-y-3 rounded-2xl border border-teal-accent/15 bg-white p-5">
      <div className="rounded-lg border border-landing-text/10 px-3 py-2 text-sm text-[#4A4A46]">
        Nombre completo
      </div>
      <div className="rounded-lg border border-landing-text/10 px-3 py-2 text-sm text-[#4A4A46]">
        Teléfono
      </div>
      <div className="rounded-lg bg-teal-accent px-4 py-2.5 text-center text-sm font-medium text-white">
        Quiero información
      </div>
    </div>
  )
}

function CrmMockup() {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-4">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-teal-accent/10 p-3">
          <p className="text-xs text-[#4A4A46]">Leads nuevos</p>
          <p className="text-2xl font-semibold text-landing-text">24</p>
        </div>
        <div className="rounded-xl bg-gold/10 p-3">
          <p className="text-xs text-[#4A4A46]">Oportunidades</p>
          <p className="text-2xl font-semibold text-landing-text">18</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { name: 'María G.', status: 'Nuevo', tone: 'teal' },
          { name: 'Carlos R.', status: 'Contactado', tone: 'gold' },
          { name: 'Ana P.', status: 'Calificado', tone: 'teal' },
        ].map((lead) => (
          <div
            key={lead.name}
            className="flex items-center justify-between rounded-lg border border-landing-text/8 px-3 py-2 text-sm"
          >
            <span className="text-landing-text">{lead.name}</span>
            <Badge
              variant={lead.tone === 'gold' ? 'gold' : 'teal'}
              className="text-[10px]"
            >
              {lead.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUpMockup() {
  return (
    <div className="space-y-2 rounded-2xl border border-teal-accent/15 bg-white p-4">
      {[
        { label: 'Hoy', text: 'Llamar a prospecto interesado', active: true },
        { label: 'Pendiente', text: 'Enviar material de formación', active: false },
        { label: 'Contactado', text: 'Seguimiento WhatsApp completado', active: false },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-xl border px-3 py-3',
            item.active
              ? 'border-teal-accent/30 bg-teal-accent/8'
              : 'border-landing-text/8 bg-landing-bg',
          )}
        >
          <p className="text-xs font-semibold text-teal-accent">{item.label}</p>
          <p className="mt-1 text-sm text-landing-text">{item.text}</p>
        </div>
      ))}
    </div>
  )
}

function AcademyMockup() {
  return (
    <div className="space-y-3 rounded-2xl border border-teal-accent/15 bg-white p-4">
      {[
        { title: 'Bienvenida al sistema', progress: 100 },
        { title: 'Cómo captar prospectos', progress: 65 },
        { title: 'Seguimiento efectivo', progress: 20 },
      ].map((lesson) => (
        <div key={lesson.title} className="rounded-xl border border-landing-text/8 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-landing-text">{lesson.title}</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-teal-accent/10">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${lesson.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function NetworkMockup() {
  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-5">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-gold/15 px-4 py-2 text-sm font-medium text-gold">
          Líder
        </div>
        <div className="h-6 w-px bg-teal-accent/40" />
        <div className="flex gap-4">
          {['Miembro A', 'Miembro B', 'Miembro C'].map((node) => (
            <div
              key={node}
              className="rounded-full border border-teal-accent/25 bg-teal-accent/8 px-3 py-1.5 text-xs text-landing-text"
            >
              {node}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const steps: Step[] = [
  {
    number: '01',
    shortTitle: 'Comparte tu landing',
    title: 'Comparte tu landing',
    description: 'Tu enlace personalizado abre la conversación correcta desde el primer contacto.',
    icon: Share2,
    mockup: <LandingMockup />,
  },
  {
    number: '02',
    shortTitle: 'El prospecto deja sus datos',
    title: 'El prospecto deja sus datos',
    description: 'Capturas la información clave sin perderla entre chats y audios.',
    icon: ClipboardList,
    mockup: <FormMockup />,
  },
  {
    number: '03',
    shortTitle: 'El lead entra al CRM',
    title: 'El lead entra al CRM',
    description: 'Cada oportunidad queda registrada con estado, contexto y seguimiento.',
    icon: Database,
    mockup: <CrmMockup />,
  },
  {
    number: '04',
    shortTitle: 'El líder da seguimiento',
    title: 'El líder da seguimiento',
    description: 'Sabes a quién contactar, cuándo hacerlo y cuál es el siguiente paso.',
    icon: MessageCircleMore,
    mockup: <FollowUpMockup />,
  },
  {
    number: '05',
    shortTitle: 'El nuevo miembro se forma',
    title: 'El nuevo miembro se forma',
    description: 'La academia guía el onboarding sin repetir la misma explicación todos los días.',
    icon: GraduationCap,
    mockup: <AcademyMockup />,
  },
  {
    number: '06',
    shortTitle: 'El sistema se duplica',
    title: 'El sistema se duplica',
    description: 'Tu equipo replica el mismo flujo con claridad, orden y dirección.',
    icon: Network,
    mockup: <NetworkMockup />,
  },
]

const DEFAULT_STEP = 2

function SectionTag() {
  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      <div className="h-px w-12 bg-linear-to-r from-transparent to-gold/60 md:w-20" />
      <div className="h-px w-8 bg-teal-accent/50 md:w-12" />
      <p className="text-xs font-semibold tracking-[0.25em] text-teal-accent">CÓMO FUNCIONA</p>
      <div className="h-px w-8 bg-teal-accent/50 md:w-12" />
      <div className="h-px w-12 bg-linear-to-l from-transparent to-gold/60 md:w-20" />
    </div>
  )
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(DEFAULT_STEP)
  const step = steps[activeStep]
  const StepIcon = step.icon

  function goToStep(index: number) {
    setActiveStep(index)
  }

  function goNext() {
    setActiveStep((current) => (current + 1) % steps.length)
  }

  function goPrev() {
    setActiveStep((current) => (current - 1 + steps.length) % steps.length)
  }

  return (
    <LandingSection id="como-funciona" className="bg-landing-bg">
      <SectionTag />

      <div className="mx-auto mb-12 max-w-4xl text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-landing-text md:text-4xl">
          Así funciona <GoldText>Expansión</GoldText> paso a paso
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4A4A46] md:text-lg">
          Cada contacto entra en una ruta clara: desde el primer interés hasta la duplicación
          del sistema.
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Paso anterior"
          onClick={goPrev}
          className="absolute -left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full border-teal-accent/25 bg-white p-0 shadow-md hover:border-teal-accent lg:flex"
        >
          <ChevronLeft className="h-5 w-5 text-teal-accent" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Paso siguiente"
          onClick={goNext}
          className="absolute -right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full border-teal-accent/25 bg-white p-0 shadow-md hover:border-teal-accent lg:flex"
        >
          <ChevronRight className="h-5 w-5 text-teal-accent" aria-hidden="true" />
        </Button>

        <Card
          padding="lg"
          className="border-gold/25 bg-white shadow-[0_16px_50px_rgba(217,164,65,0.08)] transition-all duration-300"
        >
          <CardContent className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-5 text-center lg:text-left">
              <div className="flex items-start justify-center gap-4 lg:justify-start">
                <span className="text-5xl font-semibold leading-none text-gold/25 md:text-6xl">
                  {step.number}
                </span>
                <div className="inline-flex rounded-2xl bg-teal-accent/10 p-4">
                  <StepIcon className="h-8 w-8 text-teal-accent" aria-hidden="true" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-landing-text md:text-3xl">
                  {step.title}
                </h3>
                <div className="mx-auto my-4 h-px w-12 bg-gold/70 lg:mx-0" />
                <p className="text-base leading-relaxed text-[#4A4A46]">{step.description}</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-2xl border border-landing-text/8 bg-landing-bg/60 p-4 md:max-w-none md:p-6 lg:mx-0">
              {step.mockup}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-center gap-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Paso anterior"
            onClick={goPrev}
            className="h-10 w-10 rounded-full border-teal-accent/25 p-0"
          >
            <ChevronLeft className="h-4 w-4 text-teal-accent" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Paso siguiente"
            onClick={goNext}
            className="h-10 w-10 rounded-full border-teal-accent/25 p-0"
          >
            <ChevronRight className="h-4 w-4 text-teal-accent" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-6xl">
        <div className="pointer-events-none absolute left-8 right-8 top-1/2 hidden h-px -translate-y-1/2 border-t border-dashed border-teal-accent/25 lg:block" />

        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
          {steps.map((item, index) => {
            const Icon = item.icon
            const isActive = index === activeStep

            return (
              <button
                key={item.number}
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  'min-w-[140px] shrink-0 rounded-2xl border px-3 py-4 text-center transition-all duration-200 lg:min-w-0 lg:text-left',
                  isActive
                    ? 'border-gold/40 bg-gold/8 shadow-[0_8px_24px_rgba(217,164,65,0.12)]'
                    : 'border-teal-accent/15 bg-white hover:border-teal-accent/30',
                )}
              >
                <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive ? 'text-gold' : 'text-teal-accent',
                    )}
                  >
                    {item.number}
                  </span>
                  <Icon
                    className={cn('h-4 w-4', isActive ? 'text-gold' : 'text-teal-accent')}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs leading-snug text-landing-text">{item.shortTitle}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center gap-3 rounded-2xl border border-teal-accent/15 bg-teal-accent/10 px-5 py-4 text-center sm:rounded-full lg:flex-row lg:items-center lg:justify-center lg:gap-4 lg:px-8 lg:text-left">
        <Timer className="h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-[#4A4A46] md:text-base">
          Cuando un lead no entra a un sistema,{' '}
          <strong className="font-semibold text-teal-accent">
            cada hora aumenta el riesgo de que se enfríe
          </strong>
          .
        </p>
      </div>

      <Card
        padding="lg"
        className="relative mx-auto mt-8 max-w-5xl overflow-hidden border-gold/25 bg-linear-to-r from-gold/5 via-white to-white shadow-[0_8px_32px_rgba(217,164,65,0.08)]"
      >
        <Sparkles
          className="absolute right-5 top-5 hidden h-4 w-4 text-gold/60 sm:block"
          aria-hidden="true"
        />
        <Sparkles
          className="absolute right-10 top-10 hidden h-3 w-3 text-gold/40 sm:block"
          aria-hidden="true"
        />

        <CardContent className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:text-left">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:shrink-0">
            <div className="inline-flex rounded-full bg-gold/15 p-4">
              <Target className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <div className="hidden h-12 w-px bg-teal-accent/35 lg:block" />
          </div>

          <p className="text-base leading-relaxed text-[#4A4A46] md:text-lg">
            Así cada líder deja de improvisar y empieza a trabajar con una{' '}
            <GoldText className="font-semibold text-gold">
              ruta clara de captación, seguimiento, formación y duplicación
            </GoldText>
            .
          </p>
        </CardContent>
      </Card>
    </LandingSection>
  )
}
