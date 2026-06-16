import {
  BarChart2,
  BookCopy,
  Database,
  Eye,
  MessageCircle,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { GoldText, LandingSection, SectionHeading } from '@/features/landing/components/LandingPrimitives'

const benefits = [
  { icon: Database, text: 'Base de datos organizada' },
  { icon: Eye, text: 'Seguimiento visible' },
  { icon: MessageCircle, text: 'Menos dependencia del WhatsApp desordenado' },
  { icon: BookCopy, text: 'Formación duplicable' },
  { icon: BarChart2, text: 'Métricas claras' },
  { icon: Users, text: 'Comunidad más comprometida' },
  { icon: Target, text: 'Líderes con más foco' },
  { icon: TrendingUp, text: 'Crecimiento más predecible' },
]

export function LandingBenefits() {
  return (
    <LandingSection id="beneficios" className="border-y border-landing-text/5">
      <SectionHeading
        title={
          <>
            Lo que tu equipo empieza a tener cuando trabaja con{' '}
            <GoldText>Expansión</GoldText>
          </>
        }
        subtitle="Beneficios concretos que se sienten desde la primera semana de uso."
      />

      <div className="flex flex-wrap justify-center gap-3">
        {benefits.map((benefit) => (
          <Badge
            key={benefit.text}
            variant="outline"
            className="flex items-center gap-2 border-landing-text/10 bg-white px-4 py-2 text-sm text-landing-text"
          >
            <benefit.icon className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            {benefit.text}
          </Badge>
        ))}
      </div>
    </LandingSection>
  )
}
