import type { LucideIcon } from 'lucide-react'
import {
  Clock3,
  MessageCircleOff,
  MessagesSquare,
  Repeat2,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundX,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection } from '@/features/landing/components/LandingPrimitives'
import { cn } from '@/lib/utils'

type ProblemItem = {
  number: number
  icon: LucideIcon
  title: string
  description: string
  featured?: boolean
}

const problems: ProblemItem[] = [
  {
    number: 1,
    icon: MessageCircleOff,
    title: 'Interesados que se enfrían',
    description: 'Personas que preguntan, pero nadie les da seguimiento a tiempo.',
  },
  {
    number: 2,
    icon: MessagesSquare,
    title: 'Chats imposibles de ordenar',
    description: 'Audios, mensajes y contactos mezclados sin una ruta clara.',
  },
  {
    number: 3,
    icon: Repeat2,
    title: 'Explicaciones repetidas una y otra vez',
    description: 'El líder termina gastando energía diciendo lo mismo todos los días.',
  },
  {
    number: 4,
    icon: UserRoundX,
    title: 'Nuevos miembros sin dirección',
    description: 'Entran motivados, pero no saben cuál es el siguiente paso.',
  },
  {
    number: 5,
    icon: TrendingUp,
    title: 'Crecimiento que depende solo de la memoria',
    description: 'Si no se mide, no se puede mejorar ni duplicar.',
    featured: true,
  },
]

type ProblemCardProps = ProblemItem

function ProblemCard({ number, icon: Icon, title, description, featured = false }: ProblemCardProps) {
  return (
    <Card
      padding="md"
      className={cn(
        'group relative h-full border-landing-text/8 bg-white transition-all duration-300',
        'hover:-translate-y-1 hover:border-teal-accent/30 hover:shadow-[0_16px_40px_rgba(18,18,16,0.08)]',
        featured &&
          'border-gold/40 bg-linear-to-br from-gold/8 via-white to-gold/5 hover:border-gold/50',
      )}
    >
      {featured ? (
        <Sparkles
          className="absolute right-4 top-4 h-4 w-4 text-gold/70"
          aria-hidden="true"
        />
      ) : null}

      <CardContent className="flex h-full flex-col items-center text-center lg:items-start lg:text-left">
        <div className="mb-5 flex w-full items-start justify-center lg:justify-start">
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              featured
                ? 'bg-gold/15 text-gold'
                : 'bg-teal-accent/15 text-teal-accent',
            )}
          >
            {number}
          </span>
        </div>

        <div
          className={cn(
            'mb-5 inline-flex w-fit rounded-2xl p-4',
            featured ? 'bg-gold/10' : 'bg-teal-accent/10',
          )}
        >
          <Icon
            className={cn('h-7 w-7', featured ? 'text-gold' : 'text-teal-accent')}
            aria-hidden="true"
          />
        </div>

        <h3 className="text-base font-semibold leading-snug text-landing-text">{title}</h3>
        <div className="my-3 h-px w-10 bg-gold/70 lg:mx-0" />

        <p className="text-sm leading-relaxed text-[#44443F]">{description}</p>
      </CardContent>
    </Card>
  )
}

export function LandingProblems() {
  return (
    <LandingSection className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-8 top-8 hidden h-24 w-24 opacity-40 md:block">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-teal-accent/40" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -left-8 bottom-12 hidden h-24 w-24 opacity-40 md:block">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-teal-accent/40" />
          ))}
        </div>
      </div>

      <div className="relative mx-auto mb-14 max-w-4xl text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-landing-text md:text-4xl md:leading-[1.15]">
          No estás perdiendo prospectos por falta de esfuerzo.
          <br />
          Los estás perdiendo por <GoldText>falta de sistema</GoldText>.
        </h2>

        <div className="mx-auto my-5 h-px w-12 bg-gold/70" />

        <p className="mx-auto max-w-3xl text-base leading-relaxed text-[#44443F] md:text-lg">
          Muchos líderes hacen el trabajo: publican, hablan, invitan y explican. Pero cuando
          todo vive en <strong className="font-semibold text-landing-text">WhatsApp</strong>, el
          seguimiento se enfría y las oportunidades se pierden.
        </p>
      </div>

      <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-md sm:[&>*]:max-w-none sm:[&>*]:mx-0">
        {problems.map((problem) => (
          <ProblemCard key={problem.title} {...problem} />
        ))}
      </div>

      <div className="relative mx-auto mt-8 flex max-w-4xl flex-col items-center gap-3 rounded-2xl border border-teal-accent/15 bg-teal-accent/10 px-5 py-4 text-center sm:rounded-full lg:flex-row lg:items-center lg:justify-center lg:gap-4 lg:px-8 lg:text-left">
        <Clock3 className="h-5 w-5 shrink-0 text-teal-accent" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-teal-accent md:text-base">
          Cada día que no haces seguimiento,{' '}
          <strong className="font-semibold text-gold">alguien se enfría</strong> y elige otra
          opción.
        </p>
      </div>

      <Card
        padding="lg"
        className="relative mx-auto mt-8 max-w-5xl overflow-hidden border-gold/30 bg-linear-to-r from-gold/5 via-white to-white shadow-[0_8px_32px_rgba(217,164,65,0.08)]"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />

        <CardContent className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:text-left">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:shrink-0">
            <div className="inline-flex rounded-full bg-gold/15 p-4">
              <Target className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <div className="hidden h-12 w-px bg-teal-accent/40 lg:block" />
          </div>

          <p className="text-base leading-relaxed text-[#44443F] md:text-lg">
            Expansión convierte ese desorden en un{' '}
            <GoldText className="font-semibold text-gold">
              camino claro de captación, seguimiento y duplicación
            </GoldText>
            , antes de que tus oportunidades se enfríen.
          </p>
        </CardContent>
      </Card>
    </LandingSection>
  )
}
