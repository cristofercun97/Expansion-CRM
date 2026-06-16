import { ArrowRight } from 'lucide-react'
import { PresentationBrandMark } from '@/features/presentation/components/preview/PresentationBrandMark'
import { scrollToFormulario } from '@/features/presentation/components/preview/previewUtils'
import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { cn } from '@/lib/utils'

type PresentationPreviewHeaderProps = {
  form: PresentationFormState
}

export function PresentationPreviewHeader({ form }: PresentationPreviewHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-black/10 backdrop-blur-md"
      style={{ backgroundColor: 'var(--preview-header-bg)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <PresentationBrandMark form={form} layout="header" />
        </div>

        <a
          href="#formulario"
          onClick={scrollToFormulario}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2',
            'text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 sm:gap-2 sm:px-5 sm:text-sm',
          )}
          style={{
            backgroundColor: 'var(--preview-header-button-bg)',
            color: 'var(--preview-header-button-text)',
          }}
        >
          Descubrir si es para mí
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </a>
      </div>
    </header>
  )
}
