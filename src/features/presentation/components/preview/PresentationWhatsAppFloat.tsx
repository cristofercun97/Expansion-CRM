import { MessageCircle } from 'lucide-react'
import { resolveWhatsAppContactUrl } from '@/features/presentation/utils/whatsappUtils'
import { cn } from '@/lib/utils'

type PresentationWhatsAppFloatProps = {
  url: string
}

export function PresentationWhatsAppFloat({ url }: PresentationWhatsAppFloatProps) {
  const contactUrl = resolveWhatsAppContactUrl(url)

  if (!contactUrl) {
    return null
  }

  return (
    <a
      href={contactUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className={cn(
        'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg',
        'bg-[#25D366] text-white transition-transform hover:scale-105 hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2',
        'sm:bottom-6 sm:right-6 sm:h-16 sm:w-16',
      )}
    >
      <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
    </a>
  )
}
