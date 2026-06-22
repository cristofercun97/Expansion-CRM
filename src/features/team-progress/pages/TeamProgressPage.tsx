import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Loader2,
  Radar,
  Sparkles,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { SendReminderModal } from '@/features/reminders/components/SendReminderModal'
import { TeamMemberProgressDetailModal } from '@/features/team-progress/components/TeamMemberProgressDetailModal'
import { TeamProgressBlockedPage } from '@/features/team-progress/components/TeamProgressBlockedPage'
import { useTeamProgress, useTeamProgressSummary } from '@/features/team-progress/hooks/useTeamProgress'
import {
  buildTeamCommercialProgressSummaries,
  getCommercialSummaryForMember,
} from '@/features/sales-goals/utils/salesReportAnalytics'
import type { TeamMemberProgressRow } from '@/features/team-progress/types/team-progress.types'
import {
  buildMemberModuleProgressItems,
  buildMemberTaskProgressItems,
  buildTeamFollowUpRadarInsight,
  buildTeamMemberWhatsAppUrl,
  formatMemberAcademySummary,
  formatMemberLastActivity,
  formatMemberLastReminderSummary,
  formatMemberPlanSummary,
  getAttemptsForMember,
  getEngagementsForMember,
  getRemindersForMember,
  getTaskProgressForMember,
  getTeamMemberOverallStatusBadgeClassName,
  getTeamMemberOverallStatusLabel,
  getTeamMemberPriorityBadgeClassName,
  getTeamMemberPriorityLabel,
} from '@/features/team-progress/utils/teamProgressUtils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { cn } from '@/lib/utils'

function MemberStatusBadge({ member }: { member: TeamMemberProgressRow }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        getTeamMemberOverallStatusBadgeClassName(member.overallStatus),
      )}
    >
      {getTeamMemberOverallStatusLabel(member.overallStatus)}
    </span>
  )
}

function MemberPriorityBadge({ member }: { member: TeamMemberProgressRow }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getTeamMemberPriorityBadgeClassName(member.priority),
      )}
    >
      {getTeamMemberPriorityLabel(member.priority)}
    </span>
  )
}

function MemberContactButton({ member }: { member: TeamMemberProgressRow }) {
  const whatsappUrl = buildTeamMemberWhatsAppUrl(member.memberPhone)

  if (!whatsappUrl) {
    return <span className="text-xs text-hero-text/50">Sin contacto</span>
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-lg border border-teal-accent/25 bg-teal-accent/10 px-3 py-1.5 text-xs font-medium text-teal-accent transition-colors hover:bg-teal-accent/15"
    >
      Contactar
    </a>
  )
}

function MemberActions({
  member,
  onViewDetail,
  onSendReminder,
}: {
  member: TeamMemberProgressRow
  onViewDetail: () => void
  onSendReminder: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <MemberContactButton member={member} />
        <button
          type="button"
          onClick={onSendReminder}
          className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-light transition-colors hover:bg-gold/15"
        >
          Enviar recordatorio
        </button>
        <button
          type="button"
          onClick={onViewDetail}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-hero-text transition-colors hover:bg-white/10"
        >
          Ver detalle
        </button>
      </div>
      {member.priority === 'high' ? (
        <p className="text-[11px] text-red-200/80">Requiere acompañamiento</p>
      ) : null}
      {member.unreadRemindersCount > 0 ? (
        <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-100">
          Recordatorio sin leer
        </span>
      ) : null}
      <p className="text-[11px] text-hero-text/55">
        Último recordatorio: {formatMemberLastReminderSummary(member)}
      </p>
    </div>
  )
}

export function TeamProgressPage() {
  const { appUser } = useAuth()
  const { showToast } = useToast()
  const teamId = appUser?.ownedTeamId ?? null
  const { data, loading, error, reload } = useTeamProgress(teamId)
  const summary = useTeamProgressSummary(data)
  const [selectedMember, setSelectedMember] = useState<TeamMemberProgressRow | null>(null)
  const [reminderMember, setReminderMember] = useState<TeamMemberProgressRow | null>(null)

  const radarInsight = useMemo(
    () => (summary ? buildTeamFollowUpRadarInsight(summary) : ''),
    [summary],
  )

  const testsById = useMemo(() => {
    if (!data) {
      return {}
    }

    return Object.fromEntries(data.tests.map((test) => [test.id, test]))
  }, [data])

  const selectedAttempts = useMemo(() => {
    if (!data || !selectedMember) {
      return []
    }

    return getAttemptsForMember(data.attempts, selectedMember.memberUid)
  }, [data, selectedMember])

  const selectedModuleProgress = useMemo(() => {
    if (!data || !selectedMember) {
      return []
    }

    return buildMemberModuleProgressItems(
      data.materials,
      getEngagementsForMember(data.engagements, selectedMember.memberUid),
    )
  }, [data, selectedMember])

  const selectedTaskProgress = useMemo(() => {
    if (!data || !selectedMember) {
      return []
    }

    return buildMemberTaskProgressItems(
      data.tasks,
      getTaskProgressForMember(data.taskProgress, selectedMember.memberUid),
    )
  }, [data, selectedMember])

  const selectedMemberReminders = useMemo(() => {
    if (!data || !selectedMember) {
      return []
    }

    return getRemindersForMember(data.reminders, selectedMember.memberUid)
  }, [data, selectedMember])

  const commercialSummaries = useMemo(() => {
    if (!data) {
      return []
    }

    return buildTeamCommercialProgressSummaries(
      data.salesReports,
      data.salesGoal,
      data.members,
    )
  }, [data])

  const selectedCommercialSummary = useMemo(() => {
    if (!selectedMember) {
      return null
    }

    return getCommercialSummaryForMember(commercialSummaries, selectedMember.memberUid)
  }, [commercialSummaries, selectedMember])

  if (appUser?.role !== 'admin' && !teamId) {
    return <TeamProgressBlockedPage />
  }

  if (appUser?.role === 'admin' && !teamId) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <PageHeader
          title="Progreso de Equipo"
          subtitle="Visualiza el avance global de tus miembros y detecta quién necesita acompañamiento."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />
        <EmptyState
          icon={BarChart3}
          title="Sin grupo propio configurado"
          description="Asocia un ownedTeamId a tu cuenta de administrador para consultar el progreso del equipo."
          className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
        />
      </div>
    )
  }

  const kpis = summary
    ? [
        {
          label: 'Total miembros',
          value: String(summary.totalMembers),
          detail: 'Miembros activos en tu equipo',
          icon: Users,
        },
        {
          label: 'Miembros en buen avance',
          value: String(summary.membersInGoodProgress),
          detail: 'Estado Buen avance o Excelente',
          icon: Sparkles,
        },
        {
          label: 'Necesitan seguimiento',
          value: String(summary.needsFollowUp),
          detail: 'Sin iniciar o en seguimiento',
          icon: AlertTriangle,
        },
        {
          label: 'Cumplimiento general',
          value: `${summary.generalCompliancePercent}%`,
          detail: 'Promedio entre Academia y Plan de Acción',
          icon: ClipboardList,
        },
      ]
    : []

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Progreso de Equipo"
        subtitle="Visualiza el avance global de tus miembros y detecta quién necesita acompañamiento."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando progreso del equipo...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </section>

          <section
            aria-label="Radar de seguimiento"
            className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-white/5 to-transparent p-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <Radar className="h-5 w-5 text-gold-light" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-hero-text">Radar de seguimiento</h2>
                <p className="mt-2 text-sm leading-relaxed text-hero-text/75">{radarInsight}</p>
              </div>
            </div>
          </section>

          {data?.remindersLoadError ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {data.remindersLoadError}
            </div>
          ) : null}

          {data?.salesLoadError ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {data.salesLoadError}
            </div>
          ) : null}

          {summary.members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no hay miembros en tu equipo"
              description="Invita miembros desde Mi grupo para empezar a ver su progreso."
              className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
            />
          ) : (
            <section className="space-y-4" aria-label="Seguimiento por miembro">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-hero-text">Seguimiento por miembro</h2>
                <div className="h-0.5 max-w-[120px] flex-1 rounded-full bg-gold" aria-hidden="true" />
              </div>

              <div className="grid gap-4 lg:hidden">
                {summary.members.map((member) => (
                  <article
                    key={member.memberUid}
                    className="rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-hero-text">{member.memberName}</p>
                        <p className="truncate text-sm text-hero-text/70">{member.memberEmail}</p>
                      </div>
                      <MemberPriorityBadge member={member} />
                    </div>

                    <div className="mt-3">
                      <MemberStatusBadge member={member} />
                    </div>

                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/55">Academia</dt>
                        <dd className="mt-0.5 font-medium text-hero-text">
                          {formatMemberAcademySummary(member)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/55">Plan de Acción</dt>
                        <dd className="mt-0.5 font-medium text-hero-text">
                          {formatMemberPlanSummary(member)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/55">Última actividad</dt>
                        <dd className="mt-0.5 text-hero-text/80">
                          {formatMemberLastActivity(member.lastActivityAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-hero-text/55">Último recordatorio</dt>
                        <dd className="mt-0.5 text-hero-text/80">
                          {formatMemberLastReminderSummary(member)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <MemberActions
                        member={member}
                        onViewDetail={() => setSelectedMember(member)}
                        onSendReminder={() => setReminderMember(member)}
                      />
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-hero-text/55">
                    <tr>
                      <th className="px-4 py-3 font-medium">Miembro</th>
                      <th className="px-4 py-3 font-medium">Estado general</th>
                      <th className="px-4 py-3 font-medium">Academia</th>
                      <th className="px-4 py-3 font-medium">Plan de Acción</th>
                      <th className="px-4 py-3 font-medium">Última actividad</th>
                      <th className="px-4 py-3 font-medium">Prioridad</th>
                      <th className="px-4 py-3 font-medium">Último recordatorio</th>
                      <th className="px-4 py-3 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.members.map((member) => (
                      <tr key={member.memberUid} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-4">
                          <p className="font-medium text-hero-text">{member.memberName}</p>
                          <p className="text-xs text-hero-text/60">{member.memberEmail}</p>
                        </td>
                        <td className="px-4 py-4">
                          <MemberStatusBadge member={member} />
                        </td>
                        <td className="px-4 py-4 text-hero-text/85">
                          {formatMemberAcademySummary(member)}
                        </td>
                        <td className="px-4 py-4 text-hero-text/85">
                          {formatMemberPlanSummary(member)}
                        </td>
                        <td className="px-4 py-4 text-hero-text/75">
                          {formatMemberLastActivity(member.lastActivityAt)}
                        </td>
                        <td className="px-4 py-4">
                          <MemberPriorityBadge member={member} />
                        </td>
                        <td className="px-4 py-4 text-xs text-hero-text/75">
                          {formatMemberLastReminderSummary(member)}
                        </td>
                        <td className="px-4 py-4">
                          <MemberActions
                            member={member}
                            onViewDetail={() => setSelectedMember(member)}
                            onSendReminder={() => setReminderMember(member)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <TeamMemberProgressDetailModal
            open={Boolean(selectedMember)}
            member={selectedMember}
            attempts={selectedAttempts}
            moduleProgress={selectedModuleProgress}
            taskProgress={selectedTaskProgress}
            memberReminders={selectedMemberReminders}
            testsById={testsById}
            commercialSummary={selectedCommercialSummary}
            salesGoal={data?.salesGoal ?? null}
            salesReports={data?.salesReports ?? []}
            onClose={() => setSelectedMember(null)}
          />

          <SendReminderModal
            open={Boolean(reminderMember)}
            member={reminderMember}
            teamId={teamId}
            senderUid={appUser?.uid ?? null}
            senderName={appUser?.displayName?.trim() || 'Tu líder'}
            onClose={() => setReminderMember(null)}
            onSent={() => {
              showToast('Recordatorio enviado.', 'success')
              reload()
            }}
            onError={(message) => showToast(message, 'info')}
          />
        </>
      ) : null}
    </div>
  )
}
