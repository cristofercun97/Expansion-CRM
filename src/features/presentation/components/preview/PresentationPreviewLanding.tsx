import { ExternalLink, Quote, User } from 'lucide-react'
import { useEffect } from 'react'
import {
  defaultInterestOptionsText,
  formatFreeSessionDurationLabel,
  getPresentationFormPreviewField,
  PRESENTATION_FREE_SESSION_AVAILABILITY_COPY,
  PRESENTATION_FREE_SESSION_CTA_DEFAULT,
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
  previewMutedClasses,
  previewSurfaceClasses,
  previewThemeStyle,
} from '@/features/presentation/components/preview/previewUtils'
import {
  PreviewSectionBadge,
  PreviewSectionBadgeFromMeta,
} from '@/features/presentation/components/preview/PreviewSectionBadge'
import { PresentationPublicForm } from '@/features/presentation/components/preview/PresentationPublicForm'
import { PresentationWhatsAppFloat } from '@/features/presentation/components/preview/PresentationWhatsAppFloat'
import { PresentationPreviewFooter } from '@/features/presentation/components/preview/PresentationPreviewFooter'
import { PresentationPreviewHeader } from '@/features/presentation/components/preview/PresentationPreviewHeader'
import {
  getTiktokEmbedUrl,
  getYoutubeEmbedUrl,
  isImageUrl,
} from '@/features/presentation/components/preview/videoEmbedUtils'
import { presentationFunnelService } from '@/features/presentation/services/presentationFunnel.service'
import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { resolvePresentationBookingCta } from '@/features/presentation/utils/bookingFunnelMetrics'
import { COUNTRY_OPTIONS } from '@/features/settings/constants/countries'
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
            <PreviewButton
              href={service.ctaUrl}
              scrollToForm={!hasText(service.ctaUrl)}
              className="w-full"
            >
              {service.ctaText || 'Más información'}
            </PreviewButton>
          </div>
        </article>
      ))}
    </div>
  )
}

function ContentList({ form }: { form: PresentationFormState }) {
  const items = form.contents.filter((item) => hasText(item.title) || hasText(item.url))

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-14 sm:space-y-20">
      {items.map((item, index) => {
        const url = item.url.trim()
        const youtubeEmbed = url ? getYoutubeEmbedUrl(url) : null
        const tiktokEmbed = !youtubeEmbed && url ? getTiktokEmbedUrl(url) : null
        const showImage = Boolean(url && !youtubeEmbed && !tiktokEmbed && isImageUrl(url))
        const showExternalLink = Boolean(url && !youtubeEmbed && !tiktokEmbed && !showImage)
        const hasMedia = Boolean(youtubeEmbed || tiktokEmbed || showImage)
        const isReversed = index % 2 === 1
        const indexLabel = String(index + 1).padStart(2, '0')

        return (
          <article
            key={`${item.title}-${index}`}
            className={cn(
              'grid items-center gap-8 sm:gap-10',
              hasMedia ? 'lg:grid-cols-2 lg:gap-14' : 'max-w-2xl',
              isReversed && hasMedia && 'lg:[&>*:first-child]:order-2',
            )}
          >
            <div className={cn(!hasMedia && 'mx-auto w-full text-center')}>
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl font-light tracking-tight text-[var(--preview-button-bg)]/45 sm:text-4xl"
                  aria-hidden="true"
                >
                  {indexLabel}
                </span>
                <span className="h-px flex-1 bg-[var(--preview-surface-border)]" aria-hidden="true" />
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--preview-button-bg)]">
                {item.type}
              </p>

              <h3
                className={cn(
                  'mt-3 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl',
                  previewHeadingClasses(),
                )}
              >
                {item.title || `Contenido ${index + 1}`}
              </h3>

              {showExternalLink ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--preview-button-bg)] transition-opacity hover:opacity-80"
                >
                  Abrir contenido
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}

              {hasMedia && !showExternalLink ? (
                <p className={cn('mt-4 max-w-md text-sm leading-relaxed sm:text-base', previewBodyClasses())}>
                  Una pieza para conocer más de cerca mi trabajo y experiencia.
                </p>
              ) : null}
            </div>

            {hasMedia ? (
              <div
                className={cn(
                  'relative overflow-hidden',
                  isReversed ? 'lg:justify-self-start' : 'lg:justify-self-end',
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-[var(--preview-button-bg)]/8 blur-2xl sm:-inset-4"
                  aria-hidden="true"
                />

                {youtubeEmbed || tiktokEmbed ? (
                  <div className="mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-[1.75rem] border border-[var(--preview-surface-border)] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:max-w-[280px]">
                    <iframe
                      src={youtubeEmbed ?? tiktokEmbed ?? undefined}
                      title={item.title || `Contenido ${index + 1}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : null}

                {showImage ? (
                  <img
                    src={url}
                    alt={item.title || `Contenido ${index + 1}`}
                    className="mx-auto max-h-[460px] w-full rounded-[1.75rem] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
                  />
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
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

  const bookingCta = resolvePresentationBookingCta({
    bookingEnabled: form.booking.enabled,
    landingSlug: publicContext?.landingSlug,
    resourceUrl: form.leadMagnet.resourceUrl,
  })

  useEffect(() => {
    if (!publicContext?.landingSlug) return
    void presentationFunnelService.trackPresentationFunnelEvent({
      eventKind: 'presentation_view',
      presentationSlug: publicContext.landingSlug,
      source: 'presentation_public',
      oncePerSession: true,
    })
  }, [publicContext?.landingSlug])

  return (
    <div style={previewThemeStyle(theme)} className="min-h-screen overflow-x-hidden">
      <PresentationPreviewHeader form={form} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-24">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 flex justify-center sm:mb-6">
            <PreviewSectionBadgeFromMeta meta={PRESENTATION_EDITOR_SECTIONS.mainMessage} />
          </div>
          <ProfileImage photoUrl={form.visualIdentity.photoUrl} />
          <h1
            className={cn(
              'mt-6 text-[1.75rem] font-bold leading-tight tracking-tight sm:mt-8 sm:text-4xl md:text-5xl',
              previewHeadingClasses(),
            )}
          >
            {heroTitle}
          </h1>
          <p
            className={cn(
              'mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:mt-5 sm:text-xl',
              previewBodyClasses(),
            )}
          >
            {heroSubtitle}
          </p>
          <div className="mt-7 flex justify-center sm:mt-8">
            <PreviewButton
              href={form.mainMessage.ctaUrl}
              scrollToForm={!hasText(form.mainMessage.ctaUrl)}
              className="w-full max-w-sm sm:w-auto"
            >
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

      {hasSectionContent(form.leadMagnet.title, form.leadMagnet.description) ||
      form.booking.enabled ? (
        <PreviewSection id="encuentro-gratuito">
          <div className="mx-auto flex max-w-2xl flex-col items-center overflow-x-hidden text-center">
            <div className="mb-4 flex justify-center">
              <PreviewSectionBadge
                emoji={PRESENTATION_EDITOR_SECTIONS.leadMagnet.emoji}
                label="ENCUENTRO GRATUITO"
              />
            </div>
            <h2
              className={cn(
                'text-2xl font-semibold tracking-tight sm:text-3xl',
                previewHeadingClasses(),
              )}
            >
              {form.leadMagnet.title?.trim() ||
                form.booking.title?.trim() ||
                'Aclara tus dudas en una sesión gratuita de 30 minutos'}
            </h2>
            {form.leadMagnet.description?.trim() ? (
              <p
                className={cn(
                  'mt-3 max-w-xl text-base leading-relaxed sm:text-lg',
                  previewBodyClasses(),
                )}
              >
                {form.leadMagnet.description}
              </p>
            ) : null}
            <p
              className={cn(
                'mt-5 inline-flex max-w-full items-center justify-center rounded-full border border-[var(--preview-surface-border)] bg-[var(--preview-surface-bg)] px-4 py-1.5 text-sm font-medium',
                previewHeadingClasses(),
              )}
            >
              {formatFreeSessionDurationLabel(form.booking.durationMinutes)}
            </p>
            <p className={cn('mt-4 max-w-md text-sm leading-relaxed', previewMutedClasses())}>
              {form.booking.description?.trim() || PRESENTATION_FREE_SESSION_AVAILABILITY_COPY}
            </p>
            {!bookingCta.hideCta ? (
              <div className="mt-7 flex w-full justify-center sm:mt-8">
                <PreviewButton
                  href={bookingCta.href}
                  scrollToForm={bookingCta.scrollToForm}
                  className="w-full max-w-sm sm:w-auto"
                  onClick={() => {
                    if (bookingCta.mode !== 'booking' || !publicContext?.landingSlug) return
                    void presentationFunnelService.trackPresentationFunnelEvent({
                      eventKind: 'presentation_booking_click',
                      presentationSlug: publicContext.landingSlug,
                      source: 'presentation_public',
                      oncePerSession: true,
                    })
                  }}
                >
                  {form.leadMagnet.ctaText?.trim() || PRESENTATION_FREE_SESSION_CTA_DEFAULT}
                </PreviewButton>
              </div>
            ) : null}
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
      hasText(form.socialProof.testimonialName) ||
      hasText(form.socialProof.proofUrl) ? (
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
        <section className="px-4 py-16 text-[var(--preview-body)] sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
              <PreviewHeading
                sectionKey="contents"
                title="Contenido y autoridad"
                description="Piezas seleccionadas para que conozcas mi trabajo con más profundidad."
              />
            </div>
            <ContentList form={form} />
          </div>
        </section>
      ) : null}

      {hasSectionContent(form.finalCta.title, form.finalCta.description) ? (
        <PreviewSection>
          <PreviewHeading
            sectionKey="finalCta"
            title={form.finalCta.title || '¿Listo para dar el siguiente paso?'}
            description={form.finalCta.description}
          />
          <div className="flex justify-center text-center">
            <PreviewButton
              href={form.finalCta.ctaUrl}
              scrollToForm={!hasText(form.finalCta.ctaUrl)}
              className="w-full max-w-sm sm:w-auto"
            >
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
  const nameField = getPresentationFormPreviewField('name')
  const whatsappField = getPresentationFormPreviewField('whatsapp')
  const countryField = getPresentationFormPreviewField('country')
  const cityField = getPresentationFormPreviewField('city')
  const interestField = getPresentationFormPreviewField('interest')
  const messageField = getPresentationFormPreviewField('message')

  return (
    <form className="space-y-5 rounded-2xl border border-petrol-dark/10 bg-white p-6 text-[#4A4A46] shadow-xl sm:p-8">
      {form.formConfig.nameEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#071B25]">{nameField.label}</label>
          <input
            type="text"
            disabled
            placeholder={nameField.placeholder}
            className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
          />
        </div>
      ) : null}

      {form.formConfig.whatsappEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#071B25]">{whatsappField.label}</label>
          <input
            type="tel"
            disabled
            placeholder={whatsappField.placeholder}
            className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
          />
        </div>
      ) : null}

      {form.formConfig.countryEnabled || form.formConfig.cityEnabled ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {form.formConfig.countryEnabled ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#071B25]">{countryField.label}</label>
              <select
                disabled
                className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
              >
                <option>{countryField.placeholder}</option>
                {COUNTRY_OPTIONS.slice(0, 3).map((country) => (
                  <option key={country.code}>
                    {`${country.flag} ${country.name}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.formConfig.cityEnabled ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#071B25]">{cityField.label}</label>
              <select
                disabled
                className="h-11 rounded-lg border border-petrol-dark/15 bg-bg-warm/50 px-3 text-sm text-[#4A4A46]"
              >
                <option>{cityField.placeholder}</option>
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      {form.formConfig.interestEnabled ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#071B25]">{interestField.label}</label>
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
          <label className="text-sm font-medium text-[#071B25]">{messageField.label}</label>
          <textarea
            disabled
            rows={3}
            placeholder={messageField.placeholder}
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
  const proofUrl = form.socialProof.proofUrl.trim()
  const youtubeEmbed = proofUrl ? getYoutubeEmbedUrl(proofUrl) : null
  const tiktokEmbed = !youtubeEmbed && proofUrl ? getTiktokEmbedUrl(proofUrl) : null
  const hasVideoEmbed = Boolean(youtubeEmbed || tiktokEmbed)
  const hasTestimonialCopy =
    hasText(form.socialProof.testimonialText) || hasText(form.socialProof.testimonialName)

  return (
    <div className="space-y-6">
      {hasTestimonialCopy ? (
        <blockquote className={cn('p-6 sm:p-8', previewSurfaceClasses())}>
          <Quote className="h-8 w-8 text-[var(--preview-button-bg)]" aria-hidden="true" />
          {hasText(form.socialProof.testimonialText) ? (
            <p className={cn('mt-4 text-lg italic leading-relaxed sm:text-xl', previewBodyClasses())}>
              "{form.socialProof.testimonialText}"
            </p>
          ) : null}
          {hasText(form.socialProof.testimonialName) ? (
            <footer className="mt-4 text-base font-semibold text-[var(--preview-button-bg)]">
              — {form.socialProof.testimonialName}
            </footer>
          ) : null}
        </blockquote>
      ) : null}

      {youtubeEmbed ? (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <div className="aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--preview-surface-border)] bg-black shadow-lg">
            <iframe
              src={youtubeEmbed}
              title="Video testimonio"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {tiktokEmbed ? (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
          <div className="aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[var(--preview-surface-border)] bg-black shadow-lg">
            <iframe
              src={tiktokEmbed}
              title="Video testimonio"
              className="h-full w-full"
              allow="fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {proofUrl && !hasVideoEmbed ? (
        <div className="text-center">
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--preview-button-bg)] hover:underline"
          >
            Ver prueba
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </div>
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
