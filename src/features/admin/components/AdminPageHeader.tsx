import { Badge } from '@/components/ui'
import { useDashboardUser } from '@/features/dashboard/hooks/useDashboardUser'
import { cn } from '@/lib/utils'

type AdminPageHeaderProps = {
  title: string
  subtitle: string
}

export function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  const { user, isProfileLoading } = useDashboardUser()

  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-accent">
        Administración
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1
          className={cn(
            'text-3xl font-semibold tracking-tight text-hero-text',
            isProfileLoading && 'opacity-80',
          )}
        >
          {title}
        </h1>
        <Badge
          variant="gold"
          className="border border-gold/30 bg-gold/15 !text-gold-light ring-gold/40"
        >
          {user.roleLabel}
        </Badge>
      </div>
      <p className="mt-2 text-base text-hero-text/70">{subtitle}</p>
    </header>
  )
}
