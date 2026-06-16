import { Link } from 'react-router-dom'
import { PresentationBrandMark } from '@/features/presentation/components/preview/PresentationBrandMark'
import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { getActiveSocialLinks } from '@/features/presentation/components/preview/socialLinksUtils'
import { cn } from '@/lib/utils'

type PresentationPreviewFooterProps = {
  form: PresentationFormState
}

export function PresentationPreviewFooter({ form }: PresentationPreviewFooterProps) {
  const activeLinks = getActiveSocialLinks(form.socialLinks)

  return (
    <footer className="border-t border-[var(--preview-surface-border)] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <PresentationBrandMark form={form} layout="footer" />

        {activeLinks.length > 0 ? (
          <nav aria-label="Redes sociales" className="flex flex-wrap items-center justify-center gap-3">
            {activeLinks.map(({ key, label, url, Icon }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full',
                  'border border-[var(--preview-surface-border)] bg-[var(--preview-surface-bg)]',
                  'text-[var(--preview-heading)] transition-colors',
                  'hover:bg-[var(--preview-button-bg)] hover:text-[var(--preview-button-text)]',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </a>
            ))}
          </nav>
        ) : (
          <p className={cn('text-sm', 'text-[var(--preview-body)]')}>
            Creado con{' '}
            <Link
              to="/"
              className="font-semibold text-[var(--preview-heading)] underline-offset-2 transition-opacity hover:underline hover:opacity-80"
            >
              EXPANSIÓN
            </Link>
          </p>
        )}
      </div>
    </footer>
  )
}
