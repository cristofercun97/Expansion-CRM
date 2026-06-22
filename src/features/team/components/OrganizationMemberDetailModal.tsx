import { Crown, Sprout, Users, X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import type { DirectOrganizationMemberView } from '@/features/team/types/organization-metrics.types'
import { MY_GROUP_COPY } from '@/features/team/utils/myGroupCopy'

type OrganizationMemberDetailModalProps = {
  open: boolean
  entry: DirectOrganizationMemberView | null
  onClose: () => void
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-hero-text">{value}</p>
    </div>
  )
}

export function OrganizationMemberDetailModal({
  open,
  entry,
  onClose,
}: OrganizationMemberDetailModalProps) {
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

  if (!open || !entry) {
    return null
  }

  const displayName = entry.member.memberName?.trim() || 'Miembro del equipo'
  const leaderSummary = entry.leaderSummary
  const isDirectLeader = Boolean(leaderSummary)
  const roleLabel = isDirectLeader ? MY_GROUP_COPY.leaderRole : MY_GROUP_COPY.memberRole

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar detalle organizacional"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="organization-member-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-hero-text/50">
              {MY_GROUP_COPY.memberDetailTitle}
            </p>
            <h2
              id="organization-member-detail-title"
              className="mt-1 text-xl font-semibold text-hero-text"
            >
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-hero-text/70">Rol: {roleLabel}</p>
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
          {!isDirectLeader ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm leading-relaxed text-hero-text/75">
              {MY_GROUP_COPY.memberDetailNoOrganization}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-hero-text">
                  {MY_GROUP_COPY.leaderOrganizationSectionTitle}
                </h3>
                {entry.ownedTeamName ? (
                  <p className="mt-1 text-sm text-hero-text/75">
                    {entry.ownedTeamName}
                  </p>
                ) : null}
              </div>

              {leaderSummary?.hasMetricsAccess ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricRow
                      label="Total de personas"
                      value={String(leaderSummary.totalMembers)}
                    />
                    <MetricRow
                      label="Miembros normales"
                      value={String(leaderSummary.normalMembers)}
                    />
                    <MetricRow
                      label="Líderes activos"
                      value={String(leaderSummary.activeLeaders)}
                    />
                    <MetricRow
                      label="Estado"
                      value={
                        leaderSummary.isInMotion
                          ? MY_GROUP_COPY.leaderOrganizationInMotion
                          : MY_GROUP_COPY.leaderOrganizationNoActivity
                      }
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-hero-text/70">
                    {MY_GROUP_COPY.leaderOrganizationPrivacyNote}
                  </p>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm leading-relaxed text-hero-text/75">
                  {MY_GROUP_COPY.leaderOrganizationMetricsFallback}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-hero-text/55">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Métricas agregadas
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                  Sin nombres internos
                </span>
                <span className="inline-flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                  Profundidad 1
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-white/10 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
