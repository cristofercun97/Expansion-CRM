import {
  ArrowRight,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, ProgressBar } from '@/components/ui'
import { GoldText } from '@/features/landing/components/LandingPrimitives'

const mockStats = [
  { label: 'Leads nuevos', value: '12', icon: UserPlus, accent: 'text-teal-accent' },
  { label: 'Prospectos interesados', value: '8', icon: Users, accent: 'text-gold-light' },
  { label: 'Formación activa', value: '5', icon: GraduationCap, accent: 'text-teal-accent' },
]

export function LandingHero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-12 pt-28 text-hero-text sm:px-6 sm:pt-32 lg:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-teal-accent/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-8 text-center lg:text-left">
          <Badge
            variant="outline"
            className="mx-auto border-white/30 bg-white/10 text-white ring-white/20 lg:mx-0"
          >
            Sistema de crecimiento para líderes
          </Badge>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Convierte tu captación en un{' '}
              <GoldText>sistema</GoldText> que se puede{' '}
              <GoldText>medir</GoldText>, <GoldText>seguir</GoldText> y{' '}
              <GoldText>duplicar</GoldText>
            </h1>

            <p className="mx-auto max-w-xl text-base leading-relaxed text-hero-text/75 md:text-lg lg:mx-0">
              Expansión ayuda a líderes y equipos a captar prospectos, organizar leads,
              formar nuevos miembros y hacer crecer su red sin depender del caos de WhatsApp.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:mx-0 lg:justify-start">
            <Link to="/registro">
              <Button size="lg" className="w-full bg-gold text-hero-bg hover:bg-gold-light sm:w-auto">
                Comenzar ahora
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button
                size="lg"
                className="w-full border border-white bg-white text-hero-bg hover:bg-white/90 sm:w-auto"
              >
                Ver cómo funciona
              </Button>
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="absolute -inset-4 rounded-3xl bg-teal-accent/10 blur-2xl" />

          <Card
            padding="lg"
            className="relative border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-hero-text/60">Panel del líder</p>
                <p className="text-lg font-semibold text-hero-text">Vista de crecimiento</p>
              </div>
              <div className="inline-flex rounded-full bg-teal-accent/15 p-2.5">
                <TrendingUp className="h-5 w-5 text-teal-accent" aria-hidden="true" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {mockStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <stat.icon className={`mb-3 h-5 w-5 ${stat.accent}`} aria-hidden="true" />
                  <p className="text-2xl font-semibold text-hero-text">{stat.value}</p>
                  <p className="mt-1 text-xs text-hero-text/60">{stat.label}</p>
                </div>
              ))}
            </div>

            <CardContent className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <ProgressBar
                label="Crecimiento del equipo"
                value={68}
                className="[&_span]:text-hero-text [&_p]:text-hero-text/70"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
