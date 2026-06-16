import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type AuthCardProps = {
  children: ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/20',
        'bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.35)]',
        'ring-1 ring-white/10 backdrop-blur-2xl',
        className,
      )}
    >
      <div className="border-b border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md sm:px-8">
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-hero-text/85 transition-colors hover:text-gold-light"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a inicio
        </Link>
      </div>

      <div className="p-5 backdrop-blur-xl sm:p-8">{children}</div>
    </div>
  )
}

export const authInputClassName =
  'h-11 border-white/25 bg-white/15 text-hero-text placeholder:text-hero-text/45 focus:border-teal-accent focus:ring-teal-accent/25'

export const authLabelClassName = 'text-hero-text/90'
