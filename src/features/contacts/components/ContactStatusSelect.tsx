import { Loader2 } from 'lucide-react'
import type { ContactStatus } from '@/features/contacts/types/contact.types'
import { CONTACT_STATUS_OPTIONS } from '@/features/contacts/utils/contactStatusLabels'
import { cn } from '@/lib/utils'

type ContactStatusSelectProps = {
  contactId: string
  value: ContactStatus
  disabled?: boolean
  isUpdating?: boolean
  onChange: (contactId: string, status: ContactStatus) => void
  className?: string
}

export function ContactStatusSelect({
  contactId,
  value,
  disabled = false,
  isUpdating = false,
  onChange,
  className,
}: ContactStatusSelectProps) {
  return (
    <div className={cn('relative min-w-[9.5rem]', className)}>
      <select
        value={value}
        disabled={disabled || isUpdating}
        onChange={(event) => onChange(contactId, event.target.value as ContactStatus)}
        aria-label="Cambiar estado del contacto"
        className={cn(
          'h-9 w-full rounded-lg border border-petrol-dark/15 bg-white px-2.5 pr-8 text-sm text-text-dark',
          'transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {CONTACT_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isUpdating ? (
        <Loader2
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal"
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}
