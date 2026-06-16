import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { GoldText, LandingSection, SectionHeading } from '@/features/landing/components/LandingPrimitives'

export function LandingCta() {
  return (
    <LandingSection dark>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-12 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-accent/20 blur-3xl" />

        <SectionHeading
          light
          align="center"
          title={
            <>
              Empieza a construir tu <GoldText>sistema de crecimiento</GoldText>
            </>
          }
          subtitle="Cada prospecto que no se registra, se pierde. Cada seguimiento que no se mide, se enfría. Expansión te ayuda a ordenar el proceso desde el primer contacto."
        />

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/registro">
            <Button size="lg" className="w-full bg-gold text-hero-bg hover:bg-gold-light sm:w-auto">
              Crear mi cuenta
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <a href="#contacto">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/20 bg-transparent text-hero-text hover:border-teal-accent hover:bg-teal-accent/10 sm:w-auto"
            >
              Hablar con el equipo
            </Button>
          </a>
        </div>
      </div>
    </LandingSection>
  )
}
