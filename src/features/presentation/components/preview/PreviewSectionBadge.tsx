import type { PresentationEditorSectionMeta } from '@/features/presentation/constants/presentationSectionGuides'
import { cn } from '@/lib/utils'

type PreviewSectionBadgeProps = {
  emoji: string
  label: string
  className?: string
}

export function PreviewSectionBadge({ emoji, label, className }: PreviewSectionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-sm',
        'border-[var(--preview-surface-border)] bg-[var(--preview-surface-bg)] text-[var(--preview-heading)]',
        className,
      )}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {emoji}
      </span>
      {label}
    </span>
  )
}

export function PreviewSectionBadgeFromMeta({
  meta,
  className,
}: {
  meta: Pick<PresentationEditorSectionMeta, 'emoji' | 'badge'>
  className?: string
}) {
  return <PreviewSectionBadge emoji={meta.emoji} label={meta.badge} className={className} />
}
