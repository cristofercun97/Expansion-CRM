import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { PreviewSectionBadgeFromMeta } from '@/features/presentation/components/preview/PreviewSectionBadge'
import {
  PRESENTATION_EDITOR_SECTIONS,
  type PresentationLandingSectionKey,
} from '@/features/presentation/constants/presentationSectionGuides'
import { cn } from '@/lib/utils'
import type {
  PresentationFormState,
  PresentationTextColor,
} from '@/features/presentation/types/presentation.types'

export const TEXT_COLOR_HEX: Record<PresentationTextColor, string> = {
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
}

export type PreviewTheme = {
  backgroundColor: string
  backgroundMode: 'solid' | 'gradient'
  gradientEndColor: string
  headerBackgroundColor: string
  headerButtonColor: string
  headerButtonTextColor: string
  headingColor: string
  bodyColor: string
  mutedColor: string
  surfaceBg: string
  surfaceBorder: string
  isLightHeading: boolean
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const normalized = color.trim().replace('#', '')

  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16),
    }
  }

  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    }
  }

  return null
}

function getRelativeLuminance(color: string): number {
  const rgb = parseHexColor(color)

  if (!rgb) {
    return 0
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export function isLightColor(color: string): boolean {
  return getRelativeLuminance(color) > 0.55
}

export function getPreviewTheme(form: PresentationFormState): PreviewTheme {
  const { visualIdentity } = form
  const headingColor = TEXT_COLOR_HEX[visualIdentity.headingTextColor]
  const bodyColor = TEXT_COLOR_HEX[visualIdentity.bodyTextColor]
  const isLightHeading = visualIdentity.headingTextColor === 'black'

  const mutedColor =
    visualIdentity.bodyTextColor === 'white'
      ? 'rgba(255, 255, 255, 0.75)'
      : visualIdentity.bodyTextColor === 'gray'
        ? '#9CA3AF'
        : 'rgba(0, 0, 0, 0.65)'

  return {
    backgroundColor: visualIdentity.backgroundColor,
    backgroundMode: visualIdentity.backgroundMode,
    gradientEndColor: visualIdentity.gradientEndColor,
    headerBackgroundColor: visualIdentity.headerBackgroundColor,
    headerButtonColor: visualIdentity.headerButtonColor,
    headerButtonTextColor: TEXT_COLOR_HEX[visualIdentity.headerButtonTextColor],
    headingColor,
    bodyColor,
    mutedColor,
    surfaceBg: isLightHeading ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
    surfaceBorder: isLightHeading ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
    isLightHeading,
  }
}

export function previewThemeStyle(theme: PreviewTheme): CSSProperties {
  const backgroundImage =
    theme.backgroundMode === 'gradient'
      ? `linear-gradient(180deg, ${theme.backgroundColor} 0%, ${theme.gradientEndColor} 100%)`
      : undefined

  return {
    '--preview-bg': theme.backgroundColor,
    '--preview-bg-end': theme.gradientEndColor,
    '--preview-header-bg': theme.headerBackgroundColor,
    '--preview-header-button-bg': theme.headerButtonColor,
    '--preview-header-button-text': theme.headerButtonTextColor,
    '--preview-heading': theme.headingColor,
    '--preview-body': theme.bodyColor,
    '--preview-muted': theme.mutedColor,
    '--preview-button-bg': theme.headerButtonColor,
    '--preview-button-text': theme.headerButtonTextColor,
    '--preview-surface-bg': theme.surfaceBg,
    '--preview-surface-border': theme.surfaceBorder,
    backgroundColor: theme.backgroundColor,
    backgroundImage,
  } as CSSProperties
}

export function previewHeadingClasses(): string {
  return 'text-[var(--preview-heading)]'
}

export function previewBodyClasses(): string {
  return 'text-[var(--preview-body)]'
}

export function previewMutedClasses(): string {
  return 'text-[var(--preview-muted)]'
}

export function previewSurfaceClasses(): string {
  return 'rounded-2xl border border-[var(--preview-surface-border)] bg-[var(--preview-surface-bg)]'
}

type PreviewSectionProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function PreviewSection({ children, className, id }: PreviewSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'px-4 py-14 text-[var(--preview-body)] sm:px-6 sm:py-20',
        id === 'formulario' && 'scroll-mt-[4.25rem]',
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">{children}</div>
    </section>
  )
}

type PreviewHeadingProps = {
  title: string
  description?: string
  centered?: boolean
  sectionKey?: PresentationLandingSectionKey
  hideBadge?: boolean
}

export function PreviewHeading({
  title,
  description,
  centered = true,
  sectionKey,
  hideBadge = false,
}: PreviewHeadingProps) {
  const sectionMeta = sectionKey ? PRESENTATION_EDITOR_SECTIONS[sectionKey] : null

  return (
    <div className={cn('mb-8', centered && 'text-center')}>
      {sectionMeta && !hideBadge ? (
        <div className={cn('mb-4', centered ? 'flex justify-center' : 'flex')}>
          <PreviewSectionBadgeFromMeta meta={sectionMeta} />
        </div>
      ) : null}
      <h2
        className={cn(
          'text-2xl font-semibold tracking-tight sm:text-3xl',
          previewHeadingClasses(),
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-3 text-base leading-relaxed sm:text-lg', previewBodyClasses())}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function scrollToFormulario(event?: MouseEvent<HTMLAnchorElement>): void {
  event?.preventDefault()
  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

type PreviewButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'outline'
  className?: string
  href?: string
  scrollToForm?: boolean
}

export function PreviewButton({
  children,
  variant = 'primary',
  className,
  href,
  scrollToForm = false,
}: PreviewButtonProps) {
  const styles = cn(
    'inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition-opacity hover:opacity-90',
    variant === 'primary'
      ? 'bg-[var(--preview-button-bg)] text-[var(--preview-button-text)] shadow-lg'
      : 'border-2 border-[var(--preview-button-bg)] bg-transparent text-[var(--preview-heading)]',
    className,
  )

  const trimmedHref = href?.trim()

  if (trimmedHref) {
    const external = isExternalUrl(trimmedHref)
    return (
      <a
        href={trimmedHref}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={styles}
      >
        {children}
      </a>
    )
  }

  if (scrollToForm) {
    return (
      <a href="#formulario" onClick={scrollToFormulario} className={styles}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" disabled className={cn(styles, 'cursor-not-allowed opacity-90')}>
      {children}
    </button>
  )
}

export function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

export function hasSectionContent(title: string, description: string): boolean {
  return hasText(title) || hasText(description)
}

export function getHeaderBrandTextColor(headerBackgroundColor: string): string {
  return isLightColor(headerBackgroundColor) ? '#000000' : '#FFFFFF'
}
