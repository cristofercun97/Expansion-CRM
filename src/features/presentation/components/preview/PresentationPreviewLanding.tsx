import { ExternalLink, Quote, User } from 'lucide-react'
import {
  defaultInterestOptionsText,
  presentationFormPreviewFields,
} from '@/features/presentation/constants/presentationDefaults'
import { PRESENTATION_EDITOR_SECTIONS } from '@/features/presentation/constants/presentationSectionGuides'
import {
  PreviewButton,
  PreviewHeading,
  PreviewSection,
  getPreviewTheme,
  hasSectionContent,
  hasText,
  previewBodyClasses,
  previewHeadingClasses,
  previewSurfaceClasses,
  previewThemeStyle,
} from '@/features/presentation/components/preview/previewUtils'
import { PreviewSectionBadgeFromMeta } from '@/features/presentation/components/preview/PreviewSectionBadge'
import { PresentationPublicForm } from '@/features/presentation/components/preview/PresentationPublicForm'
import { PresentationWhatsAppFloat } from '@/features/presentation/components/preview/PresentationWhatsAppFloat'
import { PresentationPreviewFooter } from '@/features/presentation/components/preview/PresentationPreviewFooter'
import { PresentationPreviewHeader } from '@/features/presentation/components/preview/PresentationPreviewHeader'
import {
  getTiktokEmbedUrl,
  getYoutubeEmbedUrl,
} from '@/features/presentation/components/preview/videoEmbedUtils'
import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { cn } from '@/lib/utils'

type PresentationPreviewLandingProps = {
  form: PresentationFormState
  /** Si se define, el formulario de contacto es funcional (landing pública). */
  publicContext?: {
    ownerUid: string
    landingSlug: string
  }
}

function ProfileImage({
  photoUrl,
  className,
}: {
  photoUrl: string
  className?: string
}) {
  const imageUrl = photoUrl.trim()

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={cn(
          'mx-auto h-28 w-28 rounded-full border-4 border-[var(--preview-button-bg)] object-cover shadow-xl sm:h-36 sm:w-36',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[var(--preview-button-bg)] bg-[var(--preview-surface-bg)] shadow-xl sm:h-36 sm:w-36',
        className,
      )}
      aria-hidden="true"
    >
      <User className="h-12 w-12 text-[var(--preview-button-bg)] sm:h-16 sm:w-16" />
    </div>
  )
}

function MethodSteps({ form }: { form: PresentationFormState }) {
  return (
    <ol className="space-y-5">
      {form.method.steps.map((step, index) => (
        <li key={index} className={cn('p-5 sm:p-6', previewSurfaceClasses())}>
          <span
            className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'var(--preview-button-bg)',
              color: 'var(--preview-button-text)',
            }}
          >
            {index + 1}
          </span>
          {hasText(step.title) ? (
            <h3 className={cn('mt-2 text-xl font-semibold', previewHeadingClasses())}>
              {step.title}
            </h3>
          ) : null}
          {hasText(step.description) ? (
            <p className={cn('mt-2 text-base leading-relaxed', previewBodyClasses())}>
              {step.description}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

function ServiceCards({ form }: { form: PresentationFormState }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {form.services.map((service, index) => (
        <article key={index} className={cn('flex flex-col p-5 sm:p-6', previewSurfaceClasses())}>
          <h3 className={cn('text-xl font-semibold', previewHeadingClasses())}>
            {service.title || `Servicio ${index + 1}`}
          </h3>
          {hasText(service.description) ? (
            <p className={cn('mt-3 flex-1 text-base leading-relaxed', previewBodyClasses())}>
              {service.description}
            </p>
          ) : null}
          <div className="mt-5">
            <PreviewButton className="w-full" scrollToForm>
              {service.ctaText || 'Más información'}
            </PreviewButton>
          </div>
        </article>
      ))}
    </div>
  )
}

function ContentList({ form }: { form: PresentationFormState }) {
  return (
    <ul className="space-y-4">
      {form.contents.map((item, index) => (
        <li
          key={index}
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5',
            previewSurfaceClasses(),
          )}
        >
          <div>
            <p className={cn('font-semibold', previewHeadingClasses())}>
              {item.title || `Contenido ${index + 1}`}
            </p>
            <span className="mt-1 inline-block rounded-full border border-[var(--preview-surface-border)] bg-[var(--preview-surface-bg)] px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--preview-button-bg)]">
              {item.type}
            </span>
          </div>
          {hasText(item.url) ? (
            <a
              href={item.url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-medium text-[var(--preview-button-bg)] hover:underline',
              )}
            >
              Ver enlace
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function PresentationPreviewLanding({ form, publicContext }: PresentationPreviewLandingProps) {
  const theme = getPreviewTheme(form)
  const parsedOptions = form.formConfig.interestOptionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const interestOptions =
    parsedOptions.length > 0 ? parsedOptions : defaultInterestOptionsText.split('\n')

  const heroTitle = form.mainMessage.valuePhrase.trim() || 'Tu propuesta de valor'
  const heroSubtitle =
    form.mainMessage.subtitle.trim() || 'Completa tu presentación para personalizar este mensaje.'

  return (
    <div style={previewThemeStyle(theme)} className="min-h-screen">
      <PresentationPreviewHeader form={form} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <PreviewSectionBadgeFromMeta meta={PRESENTATION_EDITOR_SECTIONS.mainMessage} />
          </div>
          <ProfileImage photoUrl={form.visualIdentity.photoUrl} />
          <h1
            className={cn(
              'mt-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl',
              previewHeadingClasses(),
            )}
          >
            {heroTitle}
          </h1>
          <p
            className={cn(
              'mx-auto mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl',
              previewBodyClasses(),
            )}
          >
            {heroSubtitle}
          </p>
          <div className="mt-8">
            <PreviewButton scrollToForm>
              {form.mainMessage.ctaText || 'Quiero más información'}
            </PreviewButton>
          </div>
        </div>
      </section>

      {hasSectionContent(form.problem.title, form.problem.description) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="problem"
            title={form.problem.title || 'El problema'}
            description={form.problem.description}
          />
        </PreviewSection>
      ) : null}

      {hasSectionContent(form.promise.title, form.promise.description) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="promise"
            title={form.promise.title || 'La promesa'}
            description={form.promise.description}
          />
        </PreviewSection>
      ) : null}

      {hasSectionContent(form.leadMagnet.title, form.leadMagnet.description) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="leadMagnet"
            title={form.leadMagnet.title || 'Recurso gratuito'}
            description={form.leadMagnet.description}
          />
          <div className="text-center">
            <PreviewButton
              href={form.leadMagnet.resourceUrl}
              scrollToForm={!hasText(form.leadMagnet.resourceUrl)}
            >
              {form.leadMagnet.ctaText || 'Descargar guía'}
            </PreviewButton>
          </div>
        </PreviewSection>
      ) : null}

      {hasSectionContent(form.story.title, form.story.description) ? (
        <PreviewSection>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-4 flex justify-center">
              <PreviewSectionBadgeFromMeta meta={PRESENTATION_EDITOR_SECTIONS.story} />
            </div>
            <div className="mb-6">
              <ProfileImage photoUrl={form.visualIdentity.photoUrl} />
            </div>
            <PreviewHeading
              sectionKey="story"
              hideBadge
              title={form.story.title || 'Mi historia'}
              description={form.story.description}
            />
          </div>
        </PreviewSection>
      ) : null}

      {hasText(form.method.title) ||
      form.method.steps.some((step) => hasSectionContent(step.title, step.description)) ? (
        <PreviewSection>
          <PreviewHeading sectionKey="method" title={form.method.title || 'El método'} />
          <MethodSteps form={form} />
        </PreviewSection>
      ) : null}

      {hasText(form.socialProof.testimonialText) ||
      hasText(form.socialProof.testimonialName) ? (
        <PreviewSection>
          <PreviewHeading sectionKey="socialProof" title="Prueba social" />
          <SocialProofBlock form={form} />
        </PreviewSection>
      ) : null}

      {hasText(form.videos.youtubeShortUrl) || hasText(form.videos.tiktokUrl) ? (
        <PreviewSection className="text-center">
          <PreviewHeading
            sectionKey="videos"
            title="Videos"
            description="Conoce más en video."
          />
          <VideoEmbeds form={form} />
        </PreviewSection>
      ) : null}

      {form.services.some(
        (service) => hasText(service.title) || hasText(service.description),
      ) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="services"
            title="Servicios"
            description="Elige la opción que mejor se adapte a ti."
          />
          <ServiceCards form={form} />
        </PreviewSection>
      ) : null}

      {form.contents.some((item) => hasText(item.title) || hasText(item.url)) ? (
        <PreviewSection>
          <PreviewHeading sectionKey="contents" title="Contenido y autoridad" />
          <ContentList form={form} />
        </PreviewSection>
      ) : null}

      {hasSectionContent(form.finalCta.title, form.finalCta.description) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="finalCta"
            title={form.finalCta.title || '¿Listo para dar el siguiente paso?'}
            description={form.finalCta.description}
          />
          <div className="text-center">
            <PreviewButton scrollToForm>
              {form.finalCta.ctaText || 'Comenzar ahora'}
            </PreviewButton>
          </div>
        </PreviewSection>
      ) : null}

      <PreviewSection id="formulario">
        <PreviewHeading
          sectionKey="form"
          title={form.formConfig.formTitle || '¿Te interesa dar el siguiente paso?'}
          description={form.formConfig.formDescription}
        />
        {publicContext ? (
          <PresentationPublicForm
            formConfig={form.formConfig}
            ownerUid={publicContext.ownerUid}
            landingSlug={publicContext.landingSlug}
          />
        ) : (
          <PresentationPreviewForm form={form} interestOptions={interestOptions} />
        )}
      </PreviewSection>

      <PresentationPreviewFooter form={form} />
      <PresentationWhatsAppFloat url={form.formConfig.floatingWhatsAppUrl} />
    </div>
  )
}

function PresentationPreviewForm({
  form,
  interestOptions,
}: {
  form: PresentationFormState
  interestOptions: string[]
}) {
  return (
    <form className="space-y-5 rounded-2xl border border-petrol-dark/10 bg-white p-6 text-[#4A4A46] shadow-xl sm:p-8">
      {form.formConfig.nameEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#071B25]">
            {presentationFormPreviewFields[0].label}
          </label>
          <input
            type="text"
            disabled
            placeholder={presentationFormPreviewFields[0].placeholder}
            className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
          />
        </div>
      ) : null}

      {form.formConfig.whatsappEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#071B25]">
            {presentationFormPreviewFields[1].label}
          </label>
          <input
            type="tel"
            disabled
            placeholder={presentationFormPreviewFields[1].placeholder}
            className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
          />
        </div>
      ) : null}

      {form.formConfig.interestEnabled ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#071B25]">
            {presentationFormPreviewFields[2].label}
          </label>
          <select
            disabled
            className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
          >
            {interestOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      ) : null}

      {form.formConfig.messageEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#071B25]">
            {presentationFormPreviewFields[3].label}
          </label>
          <textarea
            disabled
            rows={3}
            placeholder={presentationFormPreviewFields[3].placeholder}
            className="resize-none rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 py-2.5 text-sm text-[#4A4A46]"
          />
        </div>
      ) : null}

      <button
        type="button"
        disabled
        className="mt-2 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl text-base font-semibold opacity-90"
        style={{
          backgroundColor: 'var(--preview-button-bg)',
          color: 'var(--preview-button-text)',
        }}
      >
        Enviar (vista previa)
      </button>
    </form>
  )
}

function SocialProofBlock({ form }: { form: PresentationFormState }) {
  return (
    <blockquote className={cn('p-6 sm:p-8', previewSurfaceClasses())}>
      <Quote className="h-8 w-8 text-[var(--preview-button-bg)]" aria-hidden="true" />
      <p className={cn('mt-4 text-lg italic leading-relaxed sm:text-xl', previewBodyClasses())}>
        "{form.socialProof.testimonialText || 'Tu testimonio aparecerá aquí.'}"
      </p>
      {hasText(form.socialProof.testimonialName) ? (
        <footer className="mt-4 text-base font-semibold text-[var(--preview-button-bg)]">
          — {form.socialProof.testimonialName}
        </footer>
      ) : null}
      {hasText(form.socialProof.proofUrl) ? (
        <div className="mt-6 text-center">
          <a
            href={form.socialProof.proofUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--preview-button-bg)] hover:underline"
          >
            Ver prueba
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </blockquote>
  )
}

function VideoEmbeds({ form }: { form: PresentationFormState }) {
  const youtubeEmbed = hasText(form.videos.youtubeShortUrl)
    ? getYoutubeEmbedUrl(form.videos.youtubeShortUrl)
    : null
  const tiktokEmbed = hasText(form.videos.tiktokUrl)
    ? getTiktokEmbedUrl(form.videos.tiktokUrl)
    : null

  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      {youtubeEmbed ? (
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <p className={cn('mb-3 text-sm font-medium', previewHeadingClasses())}>YouTube</p>
          <div className="aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--preview-surface-border)] bg-black shadow-lg">
            <iframe
              src={youtubeEmbed}
              title="YouTube Short"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : hasText(form.videos.youtubeShortUrl) ? (
        <div className={cn('w-full max-w-sm p-4 text-center', previewSurfaceClasses())}>
          <p className={cn('text-sm', previewBodyClasses())}>YouTube</p>
          <a
            href={form.videos.youtubeShortUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--preview-button-bg)] hover:underline"
          >
            Abrir video
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}

      {tiktokEmbed ? (
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <p className={cn('mb-3 text-sm font-medium', previewHeadingClasses())}>TikTok</p>
          <div className="aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--preview-surface-border)] bg-black shadow-lg">
            <iframe
              src={tiktokEmbed}
              title="TikTok"
              className="h-full w-full"
              allow="fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      ) : hasText(form.videos.tiktokUrl) ? (
        <div className={cn('w-full max-w-sm p-4 text-center', previewSurfaceClasses())}>
          <p className={cn('text-sm', previewBodyClasses())}>TikTok</p>
          <a
            href={form.videos.tiktokUrl.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--preview-button-bg)] hover:underline"
          >
            Abrir video
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </div>
  )
}
