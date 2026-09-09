import { CalendarClock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  formatAttendanceRate,
  type AgendaMetricsRangePreset,
  type AgendaPersonalKpis,
  type AgendaTeamMemberMetrics,
} from '@/features/agenda/utils/agendaMetricsUtils'
import { cn } from '@/lib/utils'

const MODE_LABELS: Record<string, string> = {
  video: 'Video',
  in_person: 'Presencial',
  other: 'Otra',
}

const PRESET_OPTIONS: Array<{ id: AgendaMetricsRangePreset; label: string }> = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'last_30_days', label: 'Últimos 30 días' },
]

type AgendaMetricsPanelProps = {
  canShowTeam: boolean
  metricsScope: 'mine' | 'team'
  onMetricsScopeChange: (scope: 'mine' | 'team') => void
  preset: AgendaMetricsRangePreset
  onPresetChange: (preset: AgendaMetricsRangePreset) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  loading: boolean
  error: string
  personalKpis: AgendaPersonalKpis | null
  upcoming: Array<{
    id: string
    title?: string
    startAtMs: number
    meetingMode?: string
    meetingAudience?: string
    groupNameSnapshot?: string | null
  }>
  teamMembers: AgendaTeamMemberMetrics[]
  onOpenMeeting?: (meetingId: string) => void
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/6 p-3 sm:p-4">
      <p className="text-xs text-hero-text/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-hero-text">{value}</p>
    </div>
  )
}

function DistributionBar({
  completed,
  noShow,
  cancelled,
}: {
  completed: number
  noShow: number
  cancelled: number
}) {
  const total = completed + noShow + cancelled
  if (total <= 0) {
    return <p className="text-xs text-hero-text/45">Sin resultados en este período.</p>
  }
  const segments = [
    { key: 'completed', label: 'Realizadas', value: completed, className: 'bg-teal-accent' },
    { key: 'noShow', label: 'No asistió', value: noShow, className: 'bg-amber-400' },
    { key: 'cancelled', label: 'Canceladas', value: cancelled, className: 'bg-red-400/80' },
  ]
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        {segments.map((segment) => {
          if (segment.value <= 0) return null
          return (
            <div
              key={segment.key}
              className={cn('h-full', segment.className)}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-hero-text/65">
        {segments.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', segment.className)} />
            {segment.label} ({segment.value})
          </span>
        ))}
      </div>
    </div>
  )
}

export function AgendaMetricsPanel({
  canShowTeam,
  metricsScope,
  onMetricsScopeChange,
  preset,
  onPresetChange,
  collapsed,
  onCollapsedChange,
  loading,
  error,
  personalKpis,
  upcoming,
  teamMembers,
  onOpenMeeting,
}: AgendaMetricsPanelProps) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-light">
            Resumen de Agenda
          </p>
          <p className="mt-1 text-sm text-hero-text/65">Métricas operativas del período seleccionado.</p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-medium text-hero-text"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? 'Mostrar' : 'Ocultar'}
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {canShowTeam ? (
              <>
                <button
                  type="button"
                  onClick={() => onMetricsScopeChange('mine')}
                  className={cn(
                    'min-h-9 rounded-lg border px-3 text-xs font-medium',
                    metricsScope === 'mine'
                      ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                      : 'border-white/15 bg-white/5 text-hero-text/75',
                  )}
                >
                  Mi rendimiento
                </button>
                <button
                  type="button"
                  onClick={() => onMetricsScopeChange('team')}
                  className={cn(
                    'min-h-9 rounded-lg border px-3 text-xs font-medium',
                    metricsScope === 'team'
                      ? 'border-teal-accent/40 bg-teal-accent/15 text-teal-accent'
                      : 'border-white/15 bg-white/5 text-hero-text/75',
                  )}
                >
                  Equipo
                </button>
              </>
            ) : null}
            {PRESET_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPresetChange(item.id)}
                className={cn(
                  'min-h-9 rounded-lg border px-3 text-xs font-medium',
                  preset === item.id
                    ? 'border-gold/40 bg-gold/15 text-gold-light'
                    : 'border-white/15 bg-white/5 text-hero-text/75',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-hero-text/65">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando métricas...
            </p>
          ) : error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : metricsScope === 'team' ? (
            <div className="space-y-3">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-hero-text/55">Sin datos del equipo en este período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-hero-text/80">
                    <thead className="text-xs uppercase tracking-wide text-hero-text/45">
                      <tr>
                        <th className="px-2 py-2 font-medium">Miembro</th>
                        <th className="px-2 py-2 font-medium">Prog.</th>
                        <th className="px-2 py-2 font-medium">Real.</th>
                        <th className="px-2 py-2 font-medium">No asis.</th>
                        <th className="px-2 py-2 font-medium">Canc.</th>
                        <th className="px-2 py-2 font-medium">Asist.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.memberUid} className="border-t border-white/10">
                          <td className="px-2 py-2 font-medium text-hero-text">{member.displayName}</td>
                          <td className="px-2 py-2">{member.scheduledCount}</td>
                          <td className="px-2 py-2">{member.completedCount}</td>
                          <td className="px-2 py-2">{member.noShowCount}</td>
                          <td className="px-2 py-2">{member.cancelledCount}</td>
                          <td className="px-2 py-2">
                            {formatAttendanceRate(member.attendanceRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : personalKpis ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Programadas" value={personalKpis.scheduledCount} />
                <KpiCard label="Realizadas" value={personalKpis.completedCount} />
                <KpiCard label="No asistió" value={personalKpis.noShowCount} />
                <KpiCard label="Canceladas" value={personalKpis.cancelledCount} />
                <KpiCard
                  label="Tasa de asistencia"
                  value={formatAttendanceRate(personalKpis.attendanceRate)}
                />
                <KpiCard label="Próximas acciones" value={personalKpis.nextActionsCount} />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">
                  Distribución de resultados
                </p>
                <DistributionBar
                  completed={personalKpis.completedCount}
                  noShow={personalKpis.noShowCount}
                  cancelled={personalKpis.cancelledCount}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-hero-text/55">
                  Próximas reuniones
                </p>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-hero-text/50">No hay próximas reuniones en este período.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.map((item) => {
                      const start = new Date(item.startAtMs)
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-gold/25"
                            onClick={() => onOpenMeeting?.(item.id)}
                          >
                            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-hero-text">
                                {item.title || 'Reunión'}
                              </span>
                              <span className="block text-xs text-hero-text/55">
                                {start.toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}{' '}
                                ·{' '}
                                {start.toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {item.meetingMode ? ` · ${MODE_LABELS[item.meetingMode] || 'Otra'}` : ''}
                                {item.meetingAudience === 'group' && item.groupNameSnapshot
                                  ? ` · ${item.groupNameSnapshot}`
                                  : ''}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-hero-text/55">Sin métricas disponibles.</p>
          )}
        </div>
      ) : null}
    </section>
  )
}
