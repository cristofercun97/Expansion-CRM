import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Loader2,
  Target,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useMemberDashboardProgress } from '@/features/member-dashboard/hooks/useMemberDashboardProgress'
import { MemberWeeklyReviewCard } from '@/features/member-dashboard/components/MemberWeeklyReviewCard'
import { TeamReminderCard } from '@/features/reminders/components/TeamReminderCard'
import { cn } from '@/lib/utils'

function ProgressCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string
  icon: typeof BookOpen
  children: React.ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-light" aria-hidden="true" />
        <h3 className="text-base font-semibold text-hero-text">{title}</h3>
      </div>
      <div className="mt-4 space-y-2 text-sm text-hero-text/80">{children}</div>
    </article>
  )
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-hero-text/65">{label}</span>
      <span className="font-medium text-hero-text">{value}</span>
    </div>
  )
}

export function MemberProgressOverview() {
  const navigate = useNavigate()
  const { teamId, progress, loading, error, markingReminderId, markReminderAsRead } =
    useMemberDashboardProgress()

  function handleNextStepClick(path: string) {
    if (path.startsWith('#')) {
      document.querySelector(path)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    navigate(path)
  }

  return (
    <section className="mt-8" aria-label="Mi avance">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-hero-text">Mi avance</h2>
        <p className="mt-1 text-sm text-hero-text/70">
          Revisa tus pendientes y continúa con el siguiente paso de tu crecimiento.
        </p>
      </div>

      {!teamId ? (
        <div className="rounded-2xl border border-white/15 bg-white/8 px-5 py-6 text-sm text-hero-text/75 backdrop-blur-xl">
          Aún no formas parte de un grupo. Únete mediante una invitación o activa tu propio grupo.
        </div>
      ) : loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando tu avance...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : progress ? (
        <div className="space-y-4">
          <article className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/12 via-white/8 to-transparent p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <Target className="h-5 w-5 text-gold-light" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-hero-text">Mi siguiente paso recomendado</h3>
                <p className="mt-2 text-sm leading-relaxed text-hero-text/80">
                  {progress.nextStep.message}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 border-gold/30 bg-gold/10 text-gold-light hover:bg-gold/15"
                  onClick={() => handleNextStepClick(progress.nextStep.ctaTo)}
                >
                  {progress.nextStep.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-3">
            <ProgressCard title="Academia" icon={BookOpen}>
              <StatLine
                label="Módulos revisados"
                value={`${progress.academy.reviewedMaterialsCount}/${progress.academy.totalMaterials}`}
              />
              <StatLine label="Tests realizados" value={String(progress.academy.testsCompleted)} />
              <StatLine
                label="Promedio"
                value={
                  progress.academy.averageScore !== null
                    ? `${progress.academy.averageScore}/100`
                    : 'Sin tests'
                }
              />
              <StatLine
                label="Próximo módulo pendiente"
                value={progress.academy.nextPendingModuleTitle ?? 'Ninguno por ahora'}
              />
              <Link
                to="/dashboard/academia"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-light transition-colors hover:text-gold"
              >
                Ir a Academia
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </ProgressCard>

            <ProgressCard title="Plan de Acción" icon={ClipboardList}>
              <StatLine
                label="Tareas completadas"
                value={`${progress.plan.completedTasksCount}/${progress.plan.totalTasks}`}
              />
              <StatLine label="En progreso" value={String(progress.plan.inProgressTasksCount)} />
              <StatLine label="Pendientes" value={String(progress.plan.pendingTasksCount)} />
              <StatLine
                label="Próxima tarea pendiente"
                value={progress.plan.nextPendingTaskTitle ?? 'Ninguna por ahora'}
              />
              {progress.plan.nextPendingTaskAreaTitle ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-hero-text/65">Área del mapa</span>
                  <span className="rounded-full border border-teal-accent/25 bg-teal-accent/10 px-2.5 py-0.5 text-xs font-medium text-teal-accent">
                    {progress.plan.nextPendingTaskAreaTitle}
                  </span>
                </div>
              ) : null}
              <Link
                to="/dashboard/plan"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-light transition-colors hover:text-gold"
              >
                Ver Plan de Acción
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </ProgressCard>

            <div id="member-reminders" className="scroll-mt-24">
              <TeamReminderCard
                embedded
                reminders={progress.reminders}
                unreadCount={progress.unreadRemindersCount}
                lastReminderTitle={progress.lastReminderTitle}
                loading={false}
                markingId={markingReminderId}
                onMarkAsRead={markReminderAsRead}
              />
            </div>
          </div>

          <MemberWeeklyReviewCard review={progress.latestWeeklyReview} />
        </div>
      ) : null}
    </section>
  )
}
