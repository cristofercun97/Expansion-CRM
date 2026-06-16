import { Mail, MessageCircle } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection, SectionHeading } from '@/features/landing/components/LandingPrimitives'

export function LandingContact() {
  return (
    <LandingSection id="contacto">
      <SectionHeading
        title={
          <>
            ¿Quieres implementar <GoldText>Expansión</GoldText> en tu equipo?
          </>
        }
        subtitle="Cuéntanos sobre tu equipo y te orientamos sobre cómo empezar con el sistema."
      />

      <Card padding="lg" className="mx-auto max-w-2xl border-landing-text/8 bg-white">
        <CardContent className="space-y-6 text-center">
          <p className="text-sm leading-relaxed text-landing-text/70">
            Estamos preparando el canal oficial de contacto. Mientras tanto, puedes
            solicitar información o crear tu cuenta para explorar la plataforma.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="secondary" disabled className="w-full sm:w-auto">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Solicitar información
            </Button>
            <div className="inline-flex items-center gap-2 text-sm text-landing-text/60">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Próximamente contacto oficial
            </div>
          </div>
        </CardContent>
      </Card>
    </LandingSection>
  )
}
