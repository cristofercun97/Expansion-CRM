import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'

type DashboardPlaceholderPageProps = {
  title: string
  subtitle: string
  icon: LucideIcon
}

export function DashboardPlaceholderPage({
  title,
  subtitle,
  icon: Icon,
}: DashboardPlaceholderPageProps) {
  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      <EmptyState
        icon={Icon}
        title={title}
        description="Este módulo estará disponible próximamente."
        className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
        action={
          <Link to="/dashboard">
            <Button
              variant="secondary"
              className="bg-petrol-deep text-hero-text hover:bg-petrol-dark"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al panel
            </Button>
          </Link>
        }
      />
    </div>
  )
}
