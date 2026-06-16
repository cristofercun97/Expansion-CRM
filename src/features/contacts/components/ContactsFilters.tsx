import { Search } from 'lucide-react'
import type { Contact } from '@/features/contacts/types/contact.types'
import {
  CONTACT_STATUS_FILTER_OPTIONS,
  DEFAULT_CONTACT_FILTERS,
  getUniqueLandingSlugs,
  type ContactFiltersState,
} from '@/features/contacts/utils/contactFilters'
import { cn } from '@/lib/utils'

type ContactsFiltersProps = {
  contacts: Contact[]
  filters: ContactFiltersState
  onChange: (filters: ContactFiltersState) => void
}

const selectClassName =
  'h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-hero-text backdrop-blur-sm transition-colors focus:border-teal-accent focus:outline-none focus:ring-2 focus:ring-teal-accent/20'

export function ContactsFilters({ contacts, filters, onChange }: ContactsFiltersProps) {
  const landingOptions = getUniqueLandingSlugs(contacts)

  function updateFilters(partial: Partial<ContactFiltersState>) {
    onChange({ ...filters, ...partial })
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contacts-search" className="text-sm font-medium text-hero-text/80">
            Buscar
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hero-text/45"
              aria-hidden="true"
            />
            <input
              id="contacts-search"
              type="search"
              placeholder="Nombre, WhatsApp, interés o mensaje"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              className={cn(
                selectClassName,
                'pl-9 placeholder:text-hero-text/45',
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contacts-status-filter" className="text-sm font-medium text-hero-text/80">
            Estado
          </label>
          <select
            id="contacts-status-filter"
            value={filters.status}
            onChange={(event) =>
              updateFilters({ status: event.target.value as ContactFiltersState['status'] })
            }
            className={selectClassName}
          >
            {CONTACT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-text-dark">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contacts-landing-filter" className="text-sm font-medium text-hero-text/80">
            Presentación
          </label>
          <select
            id="contacts-landing-filter"
            value={filters.landing}
            onChange={(event) => updateFilters({ landing: event.target.value })}
            className={selectClassName}
          >
            <option value="all" className="text-text-dark">
              Todas
            </option>
            {landingOptions.map((slug) => (
              <option key={slug} value={slug} className="text-text-dark">
                {slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filters.search || filters.status !== DEFAULT_CONTACT_FILTERS.status || filters.landing !== DEFAULT_CONTACT_FILTERS.landing ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CONTACT_FILTERS)}
            className="text-sm font-medium text-teal-accent transition-colors hover:text-teal-accent/80"
          >
            Limpiar filtros
          </button>
        </div>
      ) : null}
    </section>
  )
}
