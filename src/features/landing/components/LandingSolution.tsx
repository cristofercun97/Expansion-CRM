import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  Globe,
  Layers,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection } from '@/features/landing/components/LandingPrimitives'
import { cn } from '@/lib/utils'

type SolutionItem = {
  number: string
  icon: LucideIcon
  title: string
  description: string
  featured?: boolean
}

const solutions: SolutionItem[] = [
  {
    number: '01',
    icon: Globe,
    title: 'Landing personalizada',
    description: 'Cada líder tiene su propia página para captar prospectos con su mensaje.',
  },
  {
    number: '02',
    icon: Layers,
    title: 'CRM organizado',
    description: 'Cada prospecto queda guardado con su estado y contexto.',
    featured: true,
  },
  {
    number: '03',
    icon: Workflow,
    title: 'Seguimiento claro',
    description: 'Cada contacto puede tener un camino de avance visible.',
  },
  {
    number: '04',
    icon: BookOpen,
    title: 'Formación paso a paso',
    description: 'Cada nuevo miembro puede formarse sin depender de explicaciones repetidas.',
  },
  {
    number: '05',
    icon: BarChart3,
    title: 'Avance medible',
    description: 'Cada progreso se puede ver, revisar y mejorar con datos reales.',
  },
]

type SolutionCardProps = SolutionItem

function SolutionCard({ number, icon: Icon, title, description, featured = false }: SolutionCardProps) {
  return (
    <Card
      padding="lg"
      className={cn(
        'relative h-full border-landing-text/8 bg-white shadow-[0_8px_30px_rgba(18,18,16,0.05)]',
        featured &&
          'border-gold/35 shadow-[0_12px_40px_rgba(217,164,65,0.12)] ring-1 ring-gold/15',
      )}
    >
      <CardContent className="flex h-full flex-col items-center text-center lg:items-start lg:text-left">
        <span
          className={cn(
            'mb-6 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
            featured ? 'bg-gold/15 text-gold' : 'bg-teal-accent/12 text-teal-accent',
          )}
        >
          {number}
        </span>

        <div
          className={cn(
            'mb-5 inline-flex w-fit rounded-full p-4',
            featured ? 'bg-gold/10' : 'bg-teal-accent/10',
          )}
        >
          <Icon
            className={cn('h-7 w-7', featured ? 'text-gold' : 'text-teal-accent')}
            aria-hidden="true"
          />
        </div>

        <h3 className="text-lg font-semibold text-landing-text">{title}</h3>
        <div
          className={cn('my-3 h-px w-10', featured ? 'bg-gold/70' : 'bg-teal-accent/50')}
        />

        <p className="text-sm leading-relaxed text-[#4A4A46]">{description}</p>
      </CardContent>
    </Card>
  )
}

function SolutionTag() {
  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      <div className="h-px w-12 bg-linear-to-r from-transparent to-gold/60 md:w-20" />
      <div className="h-px w-8 bg-teal-accent/50 md:w-12" />
      <p className="text-xs font-semibold tracking-[0.25em] text-teal-accent">LA SOLUCIÓN</p>
      <div className="h-px w-8 bg-teal-accent/50 md:w-12" />
      <div className="h-px w-12 bg-linear-to-l from-transparent to-gold/60 md:w-20" />
    </div>
  )
}

function DesktopFlow() {
  const [first, second, third, fourth, fifth] = solutions

  return (
    <div className="relative hidden lg:block">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3 xl:gap-5">
        <SolutionCard {...first} />
        <ArrowRight className="h-5 w-5 shrink-0 text-teal-accent/45" aria-hidden="true" />
        <SolutionCard {...second} />
        <ArrowRight className="h-5 w-5 shrink-0 text-teal-accent/45" aria-hidden="true" />
        <SolutionCard {...third} />
      </div>

      <div className="flex justify-center py-4">
        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-teal-accent/35" />
          <ChevronDown className="h-4 w-4 text-teal-accent/45" aria-hidden="true" />
          <div className="mt-1 flex items-center gap-16 xl:gap-24">
            <div className="h-px w-20 bg-teal-accent/35 xl:w-28" />
            <div className="h-px w-20 bg-teal-accent/35 xl:w-28" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-5 xl:max-w-4xl xl:gap-8">
        <SolutionCard {...fourth} />
        <ArrowRight className="h-5 w-5 shrink-0 text-teal-accent/45" aria-hidden="true" />
        <SolutionCard {...fifth} />
      </div>
    </div>
  )
}

function MobileFlow() {
  return (
    <div className="flex flex-col items-center gap-5 md:hidden [&>*]:w-full [&>*]:max-w-md">
      {solutions.map((item) => (
        <SolutionCard key={item.number} {...item} />
      ))}
    </div>
  )
}

function TabletFlow() {
  return (
    <div className="hidden gap-5 md:grid md:grid-cols-2 md:justify-items-center lg:hidden [&>*]:w-full [&>*]:max-w-md lg:[&>*]:max-w-none">
      {solutions.map((item) => (
        <SolutionCard key={item.number} {...item} />
      ))}
    </div>
  )
}

export function LandingSolution() {
  return (
    <LandingSection className="bg-landing-bg">
      <SolutionTag />

      <div className="mx-auto mb-14 max-w-4xl text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-landing-text md:text-4xl md:leading-[1.15]">
          Expansión convierte el esfuerzo diario en un{' '}
          <GoldText>camino guiado</GoldText>
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-[#4A4A46] md:text-lg">
          Cada acción deja de estar suelta: la captación, el seguimiento y la formación se
          conectan en un solo sistema.
        </p>
      </div>

      <MobileFlow />
      <TabletFlow />
      <DesktopFlow />

      <Card
        padding="lg"
        className="relative mx-auto mt-12 max-w-5xl overflow-hidden border-teal-accent/20 bg-white shadow-[0_8px_32px_rgba(106,197,188,0.08)]"
      >
        <Sparkles
          className="absolute right-5 top-5 hidden h-4 w-4 text-gold/60 sm:block"
          aria-hidden="true"
        />
        <Sparkles
          className="absolute right-10 top-10 hidden h-3 w-3 text-gold/40 sm:block"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-6 bottom-0 hidden h-20 w-32 opacity-30 sm:block">
          <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden="true">
            <path
              d="M0 30 C30 10, 60 40, 90 15 S120 25, 120 25"
              fill="none"
              stroke="#D9A441"
              strokeWidth="1"
              opacity="0.35"
            />
          </svg>
        </div>

        <CardContent className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:text-left">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:shrink-0">
            <div className="inline-flex rounded-full bg-teal-accent/10 p-4">
              <Target className="h-7 w-7 text-teal-accent" aria-hidden="true" />
            </div>
            <div className="hidden h-12 w-px bg-teal-accent/35 lg:block" />
          </div>

          <p className="text-base leading-relaxed text-[#4A4A46] md:text-lg">
            No se trata de trabajar más. Se trata de que cada esfuerzo tenga{' '}
            <GoldText className="font-semibold text-gold">
              dirección, seguimiento y continuidad
            </GoldText>
            .
          </p>
        </CardContent>
      </Card>
    </LandingSection>
  )
}
