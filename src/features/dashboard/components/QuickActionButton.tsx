import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuickActionButtonProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  className?: string
}

export function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  className,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold',
        'bg-gradient-to-r from-gold to-gold-light text-petrol-deep shadow-[0_4px_20px_rgba(217,164,65,0.35)]',
        'transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
