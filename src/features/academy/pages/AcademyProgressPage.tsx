import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Loader2,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { AcademyMemberProgressDetailModal } from '@/features/academy/components/AcademyMemberProgressDetailModal'
import { AcademyProgressBlockedPage } from '@/features/academy/components/AcademyProgressBlockedPage'
import {
  useAcademyProgress,
  useAcademyProgressSummary,
} from '@/features/academy/hooks/useAcademyProgress'
import type { AcademyMemberProgressRow } from '@/features/academy/types/academy-progress.types'
import {
  buildAcademyFollowUpMailto,
  buildMemberModuleProgressItems,
  getAttemptsForMember,
  getEngagementsForMember,
  getMemberStudyStatusBadgeClassName,
  getMemberStudyStatusLabel,
} from '@/features/academy/utils/academyProgressUtils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { TeamContextSelector } from '@/features/team/components/TeamContextSelector'
import { TeamContextSwitcher } from '@/features/team/components/TeamContextSwitcher'
import { useTeamContextSelection } from '@/features/team/hooks/useTeamContextSelection'
import { cn } from '@/lib/utils'

function MemberContactButton({ member }: { member: AcademyMemberProgressRow }) {
  const mailto = buildAcademyFollowUpMailto(member.memberEmail)

  if (!mailto) {
    return (
      <span className="text-xs text-hero-text/50">Sin email</span>
    )
  }

  return (
    <a
      href={mailto}
      className="inline-flex rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-hero-text transition-colors hover:bg-white/10"
    >
      Contactar
    </a>
  )
}

export function AcademyProgressPage() {
  const { appUser } = useAuth()
  const teamContextSelection = useTeamContextSelection()
  const isMemberView = teamContextSelection.mode === 'member'
  const leaderTeamId = isMemberView
    ? null
    : teamContextSelection.teamId ?? appUser?.ownedTeamId ?? null
  const { data, loading, error } = useAcademyProgress(leaderTeamId)
  const summary = useAcademyProgressSummary(data)
  const [selectedMember, setSelectedMember] = useState<AcademyMemberProgressRow | null>(null)

  const materialsById = useMemo(() => {
    if (!data) {
      return {}
    }

    return Object.fromEntries(data.materials.map((material) => [material.id, material]))
  }, [data])

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

  if (teamContextSelection.resolving) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-6 sm:px-8 sm:py-8">
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando progreso académico...
        </p>
      </div>
    )
  }

  if (teamContextSelection.showSelector) {
    return (
      <TeamContextSelector
        availability={teamContextSelection.availability}
        onSelect={teamContextSelection.selectContext}
      />
    )
  }

  if (isMemberView) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <PageHeader
          title="Progreso de Academia"
          subtitle="Tu avance dentro de la academia del grupo."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />

        {teamContextSelection.canSwitch ? (
          <TeamContextSwitcher
            mode="member"
            onSwitch={teamContextSelection.clearContext}
          />
        ) : null}

        <EmptyState
          icon={BookOpen}
          title="Tu avance en la academia del grupo"
          description="Aquí podrás ver tu progreso dentro de la academia del grupo mientras completas materiales y evaluaciones."
          className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
          action={
            <Link to="/dashboard/academia?context=member">
              <Button className="bg-gold text-petrol-deep hover:bg-gold-light">Ir a Academia</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (appUser?.role !== 'admin' && !leaderTeamId) {
    return <AcademyProgressBlockedPage />
  }

  if (appUser?.role === 'admin' && !leaderTeamId) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <PageHeader
          title="Progreso de Academia"
          subtitle="Consulta el rendimiento académico de los miembros de tu equipo."
          className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
        />
        <EmptyState
          icon={BarChart3}
          title="Sin grupo propio configurado"
          description="Asocia un ownedTeamId a tu cuenta de administrador para consultar el progreso académico."
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
          detail: 'Miembros activos del equipo',
          icon: Users,
        },
        {
          label: 'Total módulos',
          value: String(summary.totalMaterials),
          detail: 'Materiales disponibles en el equipo',
          icon: BookOpen,
        },
        {
          label: 'Módulos revisados',
          value: String(summary.totalModulesReviewed),
          detail: 'Aperturas registradas por miembros',
          icon: BookOpenCheck,
        },
        {
          label: 'Sin revisar módulos',
          value: String(summary.membersNotReviewedModules),
          detail: 'Miembros que no han abierto materiales',
          icon: UserRound,
        },
        {
          label: 'Promedio general',
          value: summary.averageScore !== null ? `${summary.averageScore}/100` : '—',
          detail: 'Calificación media del equipo',
          icon: TrendingUp,
        },
      ]
    : []

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Progreso de Academia"
        subtitle="Consulta el rendimiento académico de los miembros de tu equipo."
        className="border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70"
      />

      {teamContextSelection.canSwitch && teamContextSelection.mode ? (
        <TeamContextSwitcher
          mode={teamContextSelection.mode}
          onSwitch={teamContextSelection.clearContext}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando progreso académico...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </section>

          {summary.members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aún no hay miembros en tu equipo"
              description="Invita miembros desde Mi grupo para empezar a ver su progreso académico."
              className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
            />
          ) : (
            <section className="space-y-4" aria-label="Progreso por miembro">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-hero-text">Progreso por miembro</h2>
                <div className="h-0.5 max-w-[120px] flex-1 rounded-full bg-gold" aria-hidden="true" />
              </div>

              <p className="text-sm leading-relaxed text-hero-text/70">
                Usa este panel para detectar quién ya avanzó con los contenidos y quién necesita
                acompañamiento.
              </p>

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
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium',
                          getMemberStudyStatusBadgeClassName(member.studyStatus),
                        )}
                      >
                        {getMemberStudyStatusLabel(member.studyStatus)}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-hero-text/60">Avance de estudio</dt>
                        <dd className="font-semibold text-hero-text">{member.studyProgressLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-hero-text/60">Tests realizados</dt>
                        <dd className="font-semibold text-hero-text">{member.testsCompleted}</dd>
                      </div>
                      <div>
                        <dt className="text-hero-text/60">Promedio</dt>
                        <dd className="font-semibold text-hero-text">
                          {member.averageScore !== null ? `${member.averageScore}/100` : '—'}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-hero-text/60">Última actividad</dt>
                        <dd className="font-medium text-hero-text">
                          {member.lastActivityAt
                            ? formatContactDateTime(member.lastActivityAt)
                            : 'Sin actividad'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <MemberContactButton member={member} />
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-hero-text transition-colors hover:bg-white/10"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-white/15 bg-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-hero-text/65">
                    <tr>
                      <th className="px-4 py-3 font-medium">Miembro</th>
                      <th className="px-4 py-3 font-medium">Estado de estudio</th>
                      <th className="px-4 py-3 font-medium">Avance de estudio</th>
                      <th className="px-4 py-3 font-medium">Tests realizados</th>
                      <th className="px-4 py-3 font-medium">Promedio</th>
                      <th className="px-4 py-3 font-medium">Última actividad</th>
                      <th className="px-4 py-3 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.members.map((member) => (
                      <tr key={member.memberUid} className="border-b border-white/5 last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-hero-text">{member.memberName}</p>
                          <p className="text-hero-text/70">{member.memberEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                              getMemberStudyStatusBadgeClassName(member.studyStatus),
                            )}
                          >
                            {getMemberStudyStatusLabel(member.studyStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-hero-text">{member.studyProgressLabel}</td>
                        <td className="px-4 py-3 text-hero-text">{member.testsCompleted}</td>
                        <td className="px-4 py-3 text-hero-text">
                          {member.averageScore !== null ? `${member.averageScore}/100` : '—'}
                        </td>
                        <td className="px-4 py-3 text-hero-text/80">
                          {member.lastActivityAt
                            ? formatContactDateTime(member.lastActivityAt)
                            : 'Sin actividad'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <MemberContactButton member={member} />
                            <button
                              type="button"
                              onClick={() => setSelectedMember(member)}
                              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-hero-text transition-colors hover:bg-white/10"
                            >
                              Ver detalle
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}

      <AcademyMemberProgressDetailModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        attempts={selectedAttempts}
        moduleProgress={selectedModuleProgress}
        materialsById={materialsById}
        testsById={testsById}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}
