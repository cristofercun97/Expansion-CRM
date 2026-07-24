import { Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection, SectionHeading } from '@/features/landing/components/LandingPrimitives'
import { LANDING_FAQS } from '@/features/landing/data/landingFaqs'

export function LandingFaqs() {
  return (
    <LandingSection id="faqs" className="pb-24">
      <SectionHeading
        title={
          <>
            Preguntas <GoldText>frecuentes</GoldText>
          </>
        }
        subtitle="Respuestas claras para que entiendas qué es Expansión y cómo te ayuda."
      />

      <div className="mx-auto grid max-w-3xl gap-3">
        {LANDING_FAQS.map((faq) => (
          <Card key={faq.question} padding="none" className="border-landing-text/8 bg-white">
            <CardContent className="p-0">
              <details className="group">
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-landing-text marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {faq.question}
                    <span className="text-teal-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <div className="border-t border-landing-text/8 px-5 py-4">
                  <p className="text-sm leading-relaxed text-landing-text/70">{faq.answer}</p>
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </LandingSection>
  )
}
