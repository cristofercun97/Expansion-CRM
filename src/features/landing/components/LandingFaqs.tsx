import { Card, CardContent } from '@/components/ui'
import { GoldText, LandingSection, SectionHeading } from '@/features/landing/components/LandingPrimitives'

const faqs = [
  {
    question: '¿Expansión es solo un CRM?',
    answer:
      'No. Es un sistema de crecimiento que combina landing personalizada, CRM, seguimiento, formación, misiones y métricas en un solo flujo.',
  },
  {
    question: '¿Necesito saber de tecnología para usarlo?',
    answer:
      'No. Está pensado para líderes y equipos comerciales. La interfaz es simple, clara y guiada.',
  },
  {
    question: '¿Cada líder tendrá su propia landing?',
    answer:
      'Sí. Cada líder puede tener su landing personalizada para captar prospectos con su mensaje y su enlace.',
  },
  {
    question: '¿Puedo ver mis prospectos y su estado?',
    answer:
      'Sí. El CRM te permite ver quién es nuevo, quién está en seguimiento y quién avanza en el proceso.',
  },
  {
    question: '¿La academia estará dentro de la app?',
    answer:
      'Sí. La formación vivirá dentro de Expansión para que cada nuevo miembro aprenda paso a paso.',
  },
  {
    question: '¿Puedo usarlo con mi equipo actual de WhatsApp?',
    answer:
      'Sí. WhatsApp sigue siendo parte de la conversación, pero Expansión ordena lo que antes se perdía en el chat.',
  },
  {
    question: '¿Esto incluye red de referidos?',
    answer:
      'Sí. La plataforma está preparada para códigos de referido y duplicación del sistema entre líderes.',
  },
  {
    question: '¿Está listo para producción?',
    answer:
      'Estamos en fase de construcción activa. Ya puedes registrarte y probar el flujo base mientras sumamos más módulos.',
  },
]

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
        {faqs.map((faq) => (
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
