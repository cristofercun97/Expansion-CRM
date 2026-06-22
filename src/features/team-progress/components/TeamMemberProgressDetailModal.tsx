import { CheckCircle2, Circle, MessageCircle, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import {
  getActionTaskPriorityLabel,
  getActionTaskStatusLabel,
} from '@/features/action-plan/utils/actionTaskLabels'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import { getTeamReminderTypeLabel } from '@/features/reminders/utils/reminderLabels'
import type {
  TeamMemberModuleProgressItem,
  TeamMemberProgressRow,
  TeamMemberTaskProgressItem,
} from '@/features/team-progress/types/team-progress.types'
import { TeamMemberCommercialProgressSection } from '@/features/sales-goals/components/TeamMemberCommercialProgressSection'
import type {
  SalesMemberCommercialSummary,
  TeamSalesGoal,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  buildTeamMemberWhatsAppUrl,
  formatMemberLastActivity,
  getTeamMemberOverallStatusBadgeClassName,
  getTeamMemberOverallStatusLabel,
  getTeamMemberPriorityBadgeClassName,
  getTeamMemberPriorityLabel,
  getTeamMemberRecommendation,
} from '@/features/team-progress/utils/teamProgressUtils'
import { cn } from '@/lib/utils'

type TeamMemberProgressDetailModalProps = {
  open: boolean
  member: TeamMemberProgressRow | null
  attempts: AcademyTestAttempt[]
  moduleProgress: TeamMemberModuleProgressItem[]
  taskProgress: TeamMemberTaskProgressItem[]
  memberReminders: TeamReminder[]
  testsById: Record<string, AcademyTest>
  commercialSummary?: SalesMemberCommercialSummary | null
  salesGoal?: TeamSalesGoal | null
  salesReports?: TeamSalesReport[]
  onClose: () => void
}

function formatDueDateLabel(dueDate: string | null): string {
  if (!dueDate) {
    return 'Sin fecha límite'
  }

  const parsed = new Date(`${dueDate}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }

  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TeamMemberProgressDetailModal({
  open,
  member,
  attempts,
  moduleProgress,
  taskProgress,
  memberReminders,
  testsById,
  commercialSummary = null,
  salesGoal = null,
  salesReports = [],
  onClose,
}: TeamMemberProgressDetailModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  if (!open || !member) {
    return null
  }

  const whatsappUrl = buildTeamMemberWhatsAppUrl(member.memberPhone)
  const recommendation = getTeamMemberRecommendation(member.overallStatus)
  const memberInitials = member.memberName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-member-progress-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex min-w-0 items-start gap-4">
            {member.memberPhotoURL ? (
              <img
                src={member.memberPhotoURL}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full border-2 border-gold/35 object-cover shadow-[0_0_20px_rgba(217,164,65,0.12)]"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold/35 bg-gold/15 text-base font-semibold text-gold-light shadow-[0_0_20px_rgba(217,164,65,0.12)]">
                {memberInitials || 'EX'}
              </div>
            )}

            <div className="min-w-0">
              <h2 id="team-member-progress-detail-title" className="text-xl font-semibold text-hero-text">
                Detalle de progreso
              </h2>
              <p className="mt-1 font-medium text-hero-text">{member.memberName}</p>
              <p className="truncate text-sm text-hero-text/70">{member.memberEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                  getTeamMemberOverallStatusBadgeClassName(member.overallStatus),
                )}
              >
                {getTeamMemberOverallStatusLabel(member.overallStatus)}
              </span>
              <span
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  getTeamMemberPriorityBadgeClassName(member.priority),
                )}
              >
                Prioridad {getTeamMemberPriorityLabel(member.priority)}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Última actividad</dt>
                <dd className="mt-1 text-sm font-medium text-hero-text">
                  {formatMemberLastActivity(member.lastActivityAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-hero-text/55">Recomendación</dt>
                <dd className="mt-1 text-sm leading-relaxed text-hero-text/80">{recommendation}</dd>
              </div>
            </dl>
          </div>

          <section className="mt-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-hero-text">Academia</h3>
              <p className="mt-1 text-sm text-hero-text/70">
                Módulos revisados: {member.reviewedMaterialsCount}/{member.totalMaterials}
                {member.testsCompleted > 0 && member.averageScore !== null
                  ? ` · Promedio: ${member.averageScore}/100`
                  : ''}
              </p>
            </div>

            {moduleProgress.length === 0 ? (
              <p className="text-sm text-hero-text/60">Aún no hay módulos publicados.</p>
            ) : (
              <ul className="space-y-2">
                {moduleProgress.map((module) => (
                  <li
                    key={module.materialId}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    {module.reviewed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-hero-text/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-hero-text">{module.title}</p>
                      <p className="text-xs text-hero-text/60">
                        {module.reviewed ? 'Revisado' : 'Pendiente'}
                        {module.lastOpenedAt
                          ? ` · Última apertura: ${formatContactDateTime(module.lastOpenedAt)}`
                          : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-hero-text">Tests</h4>
              {attempts.length === 0 ? (
                <p className="mt-2 text-sm text-hero-text/60">Sin tests realizados.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {attempts.map((attempt) => {
                    const test = testsById[attempt.testId]
                    const label = test?.title ?? attempt.testId

                    return (
                      <li
                        key={attempt.id}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-hero-text">{label}</p>
                        <p className="mt-1 text-hero-text/70">
                          Score: {attempt.score}/100 · {attempt.correctAnswers}/
                          {attempt.totalQuestions} correctas
                        </p>
                        <p className="text-xs text-hero-text/55">
                          {attempt.submittedAt
                            ? formatContactDateTime(attempt.submittedAt)
                            : 'Sin fecha'}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-hero-text">Plan de Acción</h3>
              <p className="mt-1 text-sm text-hero-text/70">
                Tareas completadas: {member.completedTasksCount}/{member.totalTasks}
              </p>
            </div>

            {taskProgress.length === 0 ? (
              <p className="text-sm text-hero-text/60">Aún no hay tareas publicadas.</p>
            ) : (
              <ul className="space-y-2">
                {taskProgress.map((task) => (
                  <li
                    key={task.taskId}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-hero-text">{task.title}</p>
                    {task.areaTitle ? (
                      <p className="mt-1 text-xs font-medium text-teal-accent">
                        Área: {task.areaTitle}
                      </p>
                    ) : null}
                    <p className="mt-1 text-hero-text/70">
                      Estado: {getActionTaskStatusLabel(task.status)}
                    </p>
                    <p className="text-xs text-hero-text/55">
                      Prioridad: {getActionTaskPriorityLabel(task.priority)} · Límite:{' '}
                      {formatDueDateLabel(task.dueDate)}
                    </p>
                    {task.updatedAt ? (
                      <p className="text-xs text-hero-text/55">
                        Actualizado: {formatContactDateTime(task.updatedAt)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TeamMemberCommercialProgressSection
            className="mt-8"
            summary={commercialSummary}
            goal={salesGoal}
            reports={salesReports}
          />

          <section className="mt-8 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-hero-text">Historial de recordatorios</h3>
            </div>

            {memberReminders.length === 0 ? (
              <p className="text-sm text-hero-text/60">
                Aún no has enviado recordatorios a este miembro.
              </p>
            ) : (
              <ul className="space-y-2">
                {memberReminders.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-hero-text">{reminder.title}</p>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          reminder.status === 'unread'
                            ? 'border-amber-400/30 bg-amber-500/15 text-amber-100'
                            : 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent',
                        )}
                      >
                        {reminder.status === 'unread' ? 'Sin leer' : 'Leído'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-hero-text/60">
                      {getTeamReminderTypeLabel(reminder.type)} ·{' '}
                      {reminder.createdAt
                        ? formatContactDateTime(reminder.createdAt)
                        : 'Sin fecha'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 border-t border-white/10 px-6 py-4">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-accent/30 bg-teal-accent/10 px-4 py-2 text-sm font-medium text-teal-accent transition-colors hover:bg-teal-accent/15"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contactar
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-hero-text/50">Sin contacto</span>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
