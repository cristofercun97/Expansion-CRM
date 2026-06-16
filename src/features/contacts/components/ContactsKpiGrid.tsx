import { CheckCircle2, ClipboardList, Sparkles, Users } from 'lucide-react'
import { useMemo } from 'react'
import type { Contact } from '@/features/contacts/types/contact.types'
import { calculateContactKpis } from '@/features/contacts/utils/contactKpis'

type ContactsKpiGridProps = {
  contacts: Contact[]
}

const KPI_ITEMS = [
  { key: 'total', label: 'Total contactos', icon: Users },
  { key: 'new', label: 'Nuevos', icon: Sparkles },
  { key: 'following', label: 'En seguimiento', icon: ClipboardList },
  { key: 'converted', label: 'Convertidos', icon: CheckCircle2 },
] as const

export function ContactsKpiGrid({ contacts }: ContactsKpiGridProps) {
  const kpis = useMemo(() => calculateContactKpis(contacts), [contacts])

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon
        const value = kpis[item.key]

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm text-hero-text/65">{item.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-hero-text">{value}</p>
          </div>
        )
      })}
    </div>
  )
}
