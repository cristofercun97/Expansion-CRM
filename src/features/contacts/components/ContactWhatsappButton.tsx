import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { getWhatsappUrl, isValidWhatsappNumber } from '@/features/contacts/utils/whatsapp'
import { cn } from '@/lib/utils'

type ContactWhatsappButtonProps = {
  whatsapp: string
  size?: 'sm' | 'md'
  className?: string
}

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
} as const

export function ContactWhatsappButton({
  whatsapp,
  size = 'sm',
  className,
}: ContactWhatsappButtonProps) {
  const url = getWhatsappUrl(whatsapp)
  const isValid = isValidWhatsappNumber(whatsapp)

  const baseClassName = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
    sizeStyles[size],
    className,
  )

  if (!isValid || !url) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled
        title="WhatsApp no disponible"
        className={cn('border-petrol-dark/15 text-text-soft', className)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        WhatsApp
      </Button>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir WhatsApp"
      className={cn(
        baseClassName,
        'border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:border-emerald-600/50 hover:bg-emerald-100',
      )}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      WhatsApp
    </a>
  )
}
