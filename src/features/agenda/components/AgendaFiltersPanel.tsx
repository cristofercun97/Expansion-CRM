import { useState, type ReactNode } from 'react'
import { Check, ChevronDown, Filter, RotateCcw } from 'lucide-react'
import type {
  MeetingAudience,
  MeetingMode,
  MeetingStatus,
} from '@/features/agenda/types/meeting.types'
import type { AgendaAdvancedFilters } from '@/features/agenda/utils/agendaScheduleUtils'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: Array<{ id: MeetingStatus; label: string }> = [
  { id: 'scheduled', label: 'Programada' },
  { id: 'completed', label: 'Realizada' },
  { id: 'no_show', label: 'No asistió' },
  { id: 'cancelled', label: 'Cancelada' },
]

const MODE_OPTIONS: Array<{ id: MeetingMode; label: string }> = [
  { id: 'video', label: 'Video' },
  { id: 'in_person', label: 'Presencial' },
  { id: 'other', label: 'Otra' },
]

const AUDIENCE_OPTIONS: Array<{ id: MeetingAudience; label: string }> = [
  { id: 'individual', label: 'Individual' },
  { id: 'group', label: 'Grupo' },
]

const ROLE_OPTIONS = [
  { id: 'all' as const, label: 'Todos' },
  { id: 'organized' as const, label: 'Organizadas por mí' },
  { id: 'invited' as const, label: 'Invitado' },
]

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-white/8 py-3 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light/90">
          {title}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-hero-text/45 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="mt-2.5">{children}</div> : null}
    </section>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
        active
          ? 'border-gold/55 bg-gold/15 text-gold-light'
          : 'border-white/12 bg-white/[0.04] text-hero-text/70 hover:border-white/25 hover:bg-white/[0.07]',
      )}
    >
      {active ? <Check className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
      {label}
    </button>
  )
}

export type AgendaFiltersPanelProps = {
  filters: AgendaAdvancedFilters
  onChange: (next: AgendaAdvancedFilters) => void
  onClear: () => void
  isTeamScope: boolean
  accessibleGroups: Array<{ id: string; name: string }>
  activeFilterCount: number
  className?: string
}

export function AgendaFiltersPanel({
  filters,
  onChange,
  onClear,
  isTeamScope,
  accessibleGroups,
  activeFilterCount,
  className,
}: AgendaFiltersPanelProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]',
        className,
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Filter className="h-3.5 w-3.5 text-gold-light" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-hero-text">Filtros</h2>
            <p className="text-[11px] text-hero-text/50">
              {activeFilterCount > 0
                ? `${activeFilterCount} activo${activeFilterCount === 1 ? '' : 's'}`
                : 'Sin filtros activos'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={activeFilterCount === 0}
          className={cn(
            'inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors',
            activeFilterCount > 0
              ? 'border-gold/30 bg-gold/10 text-gold-light hover:bg-gold/15'
              : 'cursor-not-allowed border-white/8 text-hero-text/30',
          )}
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <FilterSection title="Estado">
          <div className="flex flex-col gap-1.5">
            {STATUS_OPTIONS.map((item) => (
              <FilterChip
                key={item.id}
                active={filters.statuses.includes(item.id)}
                label={item.label}
                onClick={() =>
                  onChange({
                    ...filters,
                    statuses: toggleInList(filters.statuses, item.id),
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Tipo">
          <div className="flex flex-wrap gap-1.5">
            {MODE_OPTIONS.map((item) => (
              <FilterChip
                key={item.id}
                active={filters.modes.includes(item.id)}
                label={item.label}
                onClick={() =>
                  onChange({
                    ...filters,
                    modes: toggleInList(filters.modes, item.id),
                  })
                }
              />
            ))}
          </div>
        </FilterSection>

        {!isTeamScope ? (
          <>
            <FilterSection title="Audiencia">
              <div className="flex flex-wrap gap-1.5">
                {AUDIENCE_OPTIONS.map((item) => (
                  <FilterChip
                    key={item.id}
                    active={filters.audiences.includes(item.id)}
                    label={item.label}
                    onClick={() =>
                      onChange({
                        ...filters,
                        audiences: toggleInList(filters.audiences, item.id),
                      })
                    }
                  />
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Grupo">
              <select
                className="min-h-10 w-full rounded-xl border border-white/12 bg-petrol-deep/80 px-3 text-sm text-hero-text outline-none focus:border-gold/40"
                value={filters.groupId || ''}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    groupId: event.target.value || null,
                  })
                }
              >
                <option value="">Todos los grupos</option>
                {accessibleGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </FilterSection>

            <FilterSection title="Rol" defaultOpen={false}>
              <div className="flex flex-col gap-1.5">
                {ROLE_OPTIONS.map((item) => (
                  <FilterChip
                    key={item.id}
                    active={filters.role === item.id}
                    label={item.label}
                    onClick={() => onChange({ ...filters, role: item.id })}
                  />
                ))}
              </div>
            </FilterSection>
          </>
        ) : null}
      </div>
    </aside>
  )
}
