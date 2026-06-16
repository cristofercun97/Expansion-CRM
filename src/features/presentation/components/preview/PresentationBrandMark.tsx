import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { getHeaderBrandTextColor } from '@/features/presentation/components/preview/previewUtils'
import { cn } from '@/lib/utils'

type PresentationBrandMarkProps = {
  form: PresentationFormState
  layout?: 'header' | 'footer'
  className?: string
}

export function PresentationBrandMark({
  form,
  layout = 'header',
  className,
}: PresentationBrandMarkProps) {
  const logoUrl = form.visualIdentity.logoUrl.trim()
  const photoUrl = form.visualIdentity.photoUrl.trim()
  const brandName = form.visualIdentity.brandName.trim()
  const brandTextColor = getHeaderBrandTextColor(form.visualIdentity.headerBackgroundColor)
  const isFooter = layout === 'footer'

  const imageUrl = logoUrl || photoUrl
  const isRoundPhoto = !logoUrl && Boolean(photoUrl)

  if (!imageUrl && !brandName) {
    return (
      <span
        className={cn(
          isFooter
            ? 'text-sm font-semibold tracking-wide text-[var(--preview-heading)]'
            : 'text-base font-semibold tracking-tight sm:text-lg',
          className,
        )}
        style={isFooter ? undefined : { color: brandTextColor }}
      >
        EXPANSIÓN
      </span>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', isFooter && 'justify-center', className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={cn(
            'shrink-0 object-contain',
            isRoundPhoto
              ? cn(
                  'rounded-full object-cover ring-2 ring-black/10',
                  isFooter ? 'h-10 w-10 ring-[var(--preview-surface-border)]' : 'h-9 w-9 sm:h-10 sm:w-10',
                )
              : isFooter
                ? 'h-10 max-w-[160px] opacity-90'
                : 'h-9 max-w-[120px] sm:h-10 sm:max-w-[140px]',
          )}
        />
      ) : null}

      {brandName ? (
        <span
          className={cn(
            'truncate font-bold',
            isFooter ? 'text-sm tracking-wide text-[var(--preview-heading)]' : 'text-base sm:text-lg',
          )}
          style={isFooter ? undefined : { color: brandTextColor }}
        >
          {brandName}
        </span>
      ) : null}
    </div>
  )
}
