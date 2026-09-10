import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { AgendaFiltersPanel, type AgendaFiltersPanelProps } from './AgendaFiltersPanel'

type AgendaMobileFiltersDrawerProps = AgendaFiltersPanelProps & {
  open: boolean
  onClose: () => void
}

export function AgendaMobileFiltersDrawer({
  open,
  onClose,
  ...panelProps
}: AgendaMobileFiltersDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Cerrar filtros"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-petrol-deep shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <p className="text-sm font-semibold text-hero-text">Filtrar agenda</p>
          <button
            type="button"
            className="rounded-lg p-1.5 text-hero-text/70 hover:bg-white/5"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AgendaFiltersPanel {...panelProps} className="border-0 bg-transparent p-0 shadow-none" />
        </div>
        <div className="border-t border-white/8 p-3">
          <Button
            type="button"
            className="w-full bg-gold text-petrol-deep hover:bg-gold-light"
            onClick={onClose}
          >
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  )
}
