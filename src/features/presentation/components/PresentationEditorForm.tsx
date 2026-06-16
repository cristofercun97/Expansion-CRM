import { Copy, Eye, Globe, Loader2, Upload, XCircle } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Input, Textarea } from '@/components/ui'
import {
  PresentationCtaInput,
  PresentationDescriptionTextarea,
  PresentationInput,
  PresentationInterestOptionsTextarea,
  PresentationTextarea,
  PresentationTitleInput,
  PresentationUrlInput,
} from '@/features/presentation/components/PresentationFormFields'
import { PRESENTATION_FIELD_LIMITS } from '@/features/presentation/constants/presentationFieldLimits'
import { PresentationSectionCard } from '@/features/presentation/components/PresentationSectionCard'
import { presentationFormPreviewFields } from '@/features/presentation/constants/presentationDefaults'
import { PRESENTATION_EDITOR_SECTIONS } from '@/features/presentation/constants/presentationSectionGuides'
import {
  PRESENTATION_CONTENT_TYPES,
  PRESENTATION_MODULE,
  PRESENTATION_TEXT_COLORS,
  type PresentationContentType,
  type PresentationFormState,
  type PresentationTextColor,
} from '@/features/presentation/types/presentation.types'
import { getPublicPresentationPath } from '@/features/presentation/utils/slugUtils'
import { cn } from '@/lib/utils'

type PresentationEditorFormProps = {
  form: PresentationFormState
  setForm: Dispatch<SetStateAction<PresentationFormState>>
  isBusy: boolean
  publishing: boolean
  isPublished: boolean
  slug: string
  onSlugChange: (value: string) => void
  onPublish: () => void
  onUnpublish: () => void
  onCopyLink: () => void
}

type ColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function ColorField({ label, value, onChange, disabled }: ColorFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-dark">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-10 w-14 cursor-pointer rounded-lg border border-petrol-dark/15 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="font-mono text-sm uppercase"
          aria-label={`${label} (hex)`}
        />
      </div>
    </div>
  )
}

type TextColorSelectProps = {
  label: string
  value: PresentationTextColor
  onChange: (value: PresentationTextColor) => void
  disabled?: boolean
}

const TEXT_COLOR_LABELS: Record<PresentationTextColor, string> = {
  white: 'Blanco',
  black: 'Negro',
  gray: 'Gris',
}

function TextColorSelect({ label, value, onChange, disabled }: TextColorSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-dark">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PresentationTextColor)}
        disabled={disabled}
        className={cn(
          'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark',
          'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {PRESENTATION_TEXT_COLORS.map((color) => (
          <option key={color} value={color}>
            {TEXT_COLOR_LABELS[color]}
          </option>
        ))}
      </select>
    </div>
  )
}

function SectionGroupTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-hero-text/55">{children}</h2>
      <div className="h-px flex-1 bg-white/10" aria-hidden="true" />
    </div>
  )
}

function updateSectionField<
  S extends keyof PresentationFormState,
  F extends keyof PresentationFormState[S],
>(
  setForm: Dispatch<SetStateAction<PresentationFormState>>,
  section: S,
  field: F,
  value: PresentationFormState[S][F],
) {
  setForm((current) => ({
    ...current,
    [section]: { ...current[section], [field]: value },
  }))
}

export function PresentationEditorForm({
  form,
  setForm,
  isBusy,
  publishing,
  isPublished,
  slug,
  onSlugChange,
  onPublish,
  onUnpublish,
  onCopyLink,
}: PresentationEditorFormProps) {
  const interestPreviewOptions = form.formConfig.interestOptionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const publicPath = slug ? getPublicPresentationPath(slug) : ''
  const publishDisabled = isBusy || publishing || !slug

  return (
    <div className="space-y-6">
      <PresentationSectionCard
        title="Estado de tu página"
        description="Configura tu enlace público y publica tu presentación."
        emoji={PRESENTATION_EDITOR_SECTIONS.status.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.status.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.status.guide}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-soft">Estado:</span>
            <Badge variant="muted">{isPublished ? 'Publicada' : 'Borrador'}</Badge>
          </div>

          <div className="max-w-md">
            <Input
              label="Enlace personalizado"
              placeholder="mi-presentacion"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
              disabled={isBusy || publishing}
              helperText="Solo minúsculas, números y guiones. Mínimo 3 caracteres."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Globe className="h-4 w-4 shrink-0 text-text-soft" aria-hidden="true" />
            <span className="text-sm font-medium text-text-soft">URL pública:</span>
            <span className="break-all font-mono text-sm text-text-dark">
              {publicPath || '/p/tu-enlace'}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={PRESENTATION_MODULE.previewRoute}>
              <Button variant="outline" className="gap-2" disabled={publishing}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                Vista previa
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onCopyLink}
              disabled={!slug || isBusy || publishing}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar enlace
            </Button>
            {isPublished ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-red-400/40 text-red-700 hover:bg-red-50"
                onClick={onUnpublish}
                disabled={isBusy || publishing}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                )}
                {publishing ? 'Despublicando...' : 'Despublicar'}
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-2"
                onClick={onPublish}
                disabled={publishDisabled}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                {publishing ? 'Publicando...' : 'Publicar'}
              </Button>
            )}
          </div>
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Identidad visual"
        description="Define los elementos visuales que representarán tu marca personal."
        emoji={PRESENTATION_EDITOR_SECTIONS.visualIdentity.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.visualIdentity.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.visualIdentity.guide}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <PresentationUrlInput
            label="Logo URL"
            type="url"
            placeholder="https://ejemplo.com/logo.png"
            value={form.visualIdentity.logoUrl}
            onChange={(event) =>
              updateSectionField(setForm, 'visualIdentity', 'logoUrl', event.target.value)
            }
          />
          <PresentationUrlInput
            label="Foto personal URL"
            type="url"
            placeholder="https://ejemplo.com/foto.jpg"
            value={form.visualIdentity.photoUrl}
            onChange={(event) =>
              updateSectionField(setForm, 'visualIdentity', 'photoUrl', event.target.value)
            }
          />
          <div className="sm:col-span-2">
            <PresentationInput
              label="Nombre de marca personal"
              placeholder="Ej: Tu Marca"
              value={form.visualIdentity.brandName}
              maxLength={PRESENTATION_FIELD_LIMITS.brandName}
              hint="brief"
              helperText="Aparece en bold junto al logo en el header y footer."
              onChange={(event) =>
                updateSectionField(setForm, 'visualIdentity', 'brandName', event.target.value)
              }
            />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-dark">Fondo de la landing</label>
            <select
              value={form.visualIdentity.backgroundMode}
              onChange={(event) =>
                updateSectionField(
                  setForm,
                  'visualIdentity',
                  'backgroundMode',
                  event.target.value as PresentationFormState['visualIdentity']['backgroundMode'],
                )
              }
              disabled={isBusy}
              className={cn(
                'h-10 w-full max-w-xs rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark',
                'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
              )}
            >
              <option value="solid">Color sólido</option>
              <option value="gradient">Gradiente</option>
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label="Color de fondo"
              value={form.visualIdentity.backgroundColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'backgroundColor', value)
              }
              disabled={isBusy}
            />
            {form.visualIdentity.backgroundMode === 'gradient' ? (
              <ColorField
                label="Color final del gradiente"
                value={form.visualIdentity.gradientEndColor}
                onChange={(value) =>
                  updateSectionField(setForm, 'visualIdentity', 'gradientEndColor', value)
                }
                disabled={isBusy}
              />
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label="Color del header"
              value={form.visualIdentity.headerBackgroundColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'headerBackgroundColor', value)
              }
              disabled={isBusy}
            />
            <ColorField
              label="Color del botón «Descubrir si es para mí»"
              value={form.visualIdentity.headerButtonColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'headerButtonColor', value)
              }
              disabled={isBusy}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TextColorSelect
              label="Color del texto del botón header"
              value={form.visualIdentity.headerButtonTextColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'headerButtonTextColor', value)
              }
              disabled={isBusy}
            />
            <TextColorSelect
              label="Color de títulos"
              value={form.visualIdentity.headingTextColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'headingTextColor', value)
              }
              disabled={isBusy}
            />
            <TextColorSelect
              label="Color de párrafos"
              value={form.visualIdentity.bodyTextColor}
              onChange={(value) =>
                updateSectionField(setForm, 'visualIdentity', 'bodyTextColor', value)
              }
              disabled={isBusy}
            />
          </div>
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Mensaje principal"
        description="Comunica tu propuesta de valor de forma clara y directa."
        emoji={PRESENTATION_EDITOR_SECTIONS.mainMessage.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.mainMessage.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.mainMessage.guide}
      >
        <div className="space-y-5">
          <PresentationInput
            label="Frase clara de valor"
            placeholder="Ej: Ayudo a personas a crecer con un sistema probado"
            value={form.mainMessage.valuePhrase}
            maxLength={PRESENTATION_FIELD_LIMITS.valuePhrase}
            showCounter
            hint="brief"
            onChange={(event) =>
              updateSectionField(setForm, 'mainMessage', 'valuePhrase', event.target.value)
            }
          />
          <PresentationInput
            label="Subtítulo"
            placeholder="Ej: Conoce cómo funciona y da el primer paso hoy"
            value={form.mainMessage.subtitle}
            maxLength={PRESENTATION_FIELD_LIMITS.subtitle}
            showCounter
            hint="readable"
            onChange={(event) =>
              updateSectionField(setForm, 'mainMessage', 'subtitle', event.target.value)
            }
          />
          <PresentationCtaInput
            label="Texto del botón principal"
            placeholder="Ej: Quiero más información"
            value={form.mainMessage.ctaText}
            onChange={(event) =>
              updateSectionField(setForm, 'mainMessage', 'ctaText', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <SectionGroupTitle>Contenido de tu landing</SectionGroupTitle>

      <PresentationSectionCard
        title="Problema"
        description="Tienes talento, pero tu marca no lo comunica."
        emoji={PRESENTATION_EDITOR_SECTIONS.problem.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.problem.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.problem.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título"
            value={form.problem.title}
            onChange={(event) => updateSectionField(setForm, 'problem', 'title', event.target.value)}
          />
          <PresentationDescriptionTextarea
            label="Descripción"
            rows={3}
            value={form.problem.description}
            onChange={(event) =>
              updateSectionField(setForm, 'problem', 'description', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Promesa"
        description="Explica qué resultado puede conseguir la persona contigo."
        emoji={PRESENTATION_EDITOR_SECTIONS.promise.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.promise.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.promise.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título"
            value={form.promise.title}
            onChange={(event) => updateSectionField(setForm, 'promise', 'title', event.target.value)}
          />
          <PresentationDescriptionTextarea
            label="Descripción"
            rows={3}
            value={form.promise.description}
            onChange={(event) =>
              updateSectionField(setForm, 'promise', 'description', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Lead magnet"
        description="Guía, diagnóstico o clase gratuita."
        emoji={PRESENTATION_EDITOR_SECTIONS.leadMagnet.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.leadMagnet.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.leadMagnet.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título"
            value={form.leadMagnet.title}
            onChange={(event) => updateSectionField(setForm, 'leadMagnet', 'title', event.target.value)}
          />
          <PresentationDescriptionTextarea
            label="Descripción"
            rows={3}
            value={form.leadMagnet.description}
            onChange={(event) =>
              updateSectionField(setForm, 'leadMagnet', 'description', event.target.value)
            }
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <PresentationCtaInput
              label="Texto del botón"
              value={form.leadMagnet.ctaText}
              onChange={(event) =>
                updateSectionField(setForm, 'leadMagnet', 'ctaText', event.target.value)
              }
            />
            <PresentationUrlInput
              label="URL del recurso"
              type="url"
              placeholder="https://..."
              value={form.leadMagnet.resourceUrl}
              onChange={(event) =>
                updateSectionField(setForm, 'leadMagnet', 'resourceUrl', event.target.value)
              }
            />
          </div>
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Historia"
        description="Quién eres y por qué haces esto."
        emoji={PRESENTATION_EDITOR_SECTIONS.story.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.story.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.story.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título"
            value={form.story.title}
            onChange={(event) => updateSectionField(setForm, 'story', 'title', event.target.value)}
          />
          <PresentationTextarea
            label="Descripción"
            rows={4}
            value={form.story.description}
            maxLength={PRESENTATION_FIELD_LIMITS.storyDescription}
            showCounter
            hint="readable"
            onChange={(event) =>
              updateSectionField(setForm, 'story', 'description', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Método"
        description="Tu sistema en 3 pasos."
        emoji={PRESENTATION_EDITOR_SECTIONS.method.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.method.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.method.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título de la sección"
            value={form.method.title}
            onChange={(event) => updateSectionField(setForm, 'method', 'title', event.target.value)}
          />
          {form.method.steps.map((step, index) => (
            <div
              key={index}
              className="rounded-xl border border-petrol-dark/10 bg-bg-warm/40 p-4"
            >
              <p className="mb-4 text-sm font-semibold text-text-dark">Paso {index + 1}</p>
              <div className="space-y-4">
                <PresentationTitleInput
                  label="Título del paso"
                  value={step.title}
                  onChange={(event) =>
                    setForm((current) => {
                      const steps = [...current.method.steps] as PresentationFormState['method']['steps']
                      steps[index] = { ...steps[index], title: event.target.value }
                      return { ...current, method: { ...current.method, steps } }
                    })
                  }
                />
                <PresentationDescriptionTextarea
                  label="Descripción"
                  rows={2}
                  value={step.description}
                  onChange={(event) =>
                    setForm((current) => {
                      const steps = [...current.method.steps] as PresentationFormState['method']['steps']
                      steps[index] = { ...steps[index], description: event.target.value }
                      return { ...current, method: { ...current.method, steps } }
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Prueba social"
        description="Testimonios, casos, capturas o eventos."
        emoji={PRESENTATION_EDITOR_SECTIONS.socialProof.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.socialProof.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.socialProof.guide}
      >
        <div className="space-y-5">
          <PresentationInput
            label="Nombre del testimonio"
            value={form.socialProof.testimonialName}
            maxLength={PRESENTATION_FIELD_LIMITS.testimonialName}
            onChange={(event) =>
              updateSectionField(setForm, 'socialProof', 'testimonialName', event.target.value)
            }
          />
          <PresentationTextarea
            label="Texto del testimonio"
            rows={3}
            value={form.socialProof.testimonialText}
            maxLength={PRESENTATION_FIELD_LIMITS.testimonialText}
            showCounter
            hint="readable"
            onChange={(event) =>
              updateSectionField(setForm, 'socialProof', 'testimonialText', event.target.value)
            }
          />
          <PresentationUrlInput
            label="URL de prueba (captura, evento, etc.)"
            type="url"
            placeholder="https://..."
            value={form.socialProof.proofUrl}
            onChange={(event) =>
              updateSectionField(setForm, 'socialProof', 'proofUrl', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Videos"
        description="Puedes pegar un enlace de YouTube Shorts o TikTok."
        emoji={PRESENTATION_EDITOR_SECTIONS.videos.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.videos.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.videos.guide}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <PresentationUrlInput
            label="YouTube Short URL"
            type="url"
            placeholder="https://youtube.com/shorts/..."
            value={form.videos.youtubeShortUrl}
            onChange={(event) =>
              updateSectionField(setForm, 'videos', 'youtubeShortUrl', event.target.value)
            }
          />
          <PresentationUrlInput
            label="TikTok URL"
            type="url"
            placeholder="https://tiktok.com/@..."
            value={form.videos.tiktokUrl}
            onChange={(event) => updateSectionField(setForm, 'videos', 'tiktokUrl', event.target.value)}
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Servicios"
        description="Presenta hasta 3 servicios principales que ofreces."
        emoji={PRESENTATION_EDITOR_SECTIONS.services.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.services.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.services.guide}
      >
        <div className="space-y-5">
          {form.services.map((service, index) => (
            <div
              key={index}
              className="rounded-xl border border-petrol-dark/10 bg-bg-warm/40 p-4"
            >
              <p className="mb-4 text-sm font-semibold text-text-dark">
                Servicio {index + 1}
              </p>
              <div className="space-y-4">
                <PresentationTitleInput
                  label="Título"
                  value={service.title}
                  onChange={(event) =>
                    setForm((current) => {
                      const services = [...current.services] as PresentationFormState['services']
                      services[index] = { ...services[index], title: event.target.value }
                      return { ...current, services }
                    })
                  }
                />
                <PresentationDescriptionTextarea
                  label="Descripción"
                  rows={2}
                  value={service.description}
                  onChange={(event) =>
                    setForm((current) => {
                      const services = [...current.services] as PresentationFormState['services']
                      services[index] = { ...services[index], description: event.target.value }
                      return { ...current, services }
                    })
                  }
                />
                <PresentationCtaInput
                  label="Texto del botón"
                  value={service.ctaText}
                  onChange={(event) =>
                    setForm((current) => {
                      const services = [...current.services] as PresentationFormState['services']
                      services[index] = { ...services[index], ctaText: event.target.value }
                      return { ...current, services }
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Contenido / Autoridad"
        description="Comparte videos, artículos o entrevistas que refuercen tu credibilidad."
        emoji={PRESENTATION_EDITOR_SECTIONS.contents.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.contents.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.contents.guide}
      >
        <div className="space-y-5">
          {form.contents.map((content, index) => (
            <div
              key={index}
              className="rounded-xl border border-petrol-dark/10 bg-bg-warm/40 p-4"
            >
              <p className="mb-4 text-sm font-semibold text-text-dark">
                Contenido {index + 1}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <PresentationTitleInput
                  label="Título"
                  value={content.title}
                  onChange={(event) =>
                    setForm((current) => {
                      const contents = [...current.contents] as PresentationFormState['contents']
                      contents[index] = { ...contents[index], title: event.target.value }
                      return { ...current, contents }
                    })
                  }
                />
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`content-type-${index}`}
                    className="text-sm font-medium text-text-dark"
                  >
                    Tipo
                  </label>
                  <select
                    id={`content-type-${index}`}
                    value={content.type}
                    onChange={(event) =>
                      setForm((current) => {
                        const contents = [...current.contents] as PresentationFormState['contents']
                        contents[index] = {
                          ...contents[index],
                          type: event.target.value as PresentationContentType,
                        }
                        return { ...current, contents }
                      })
                    }
                    className={cn(
                      'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark',
                      'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
                    )}
                  >
                    {PRESENTATION_CONTENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <PresentationUrlInput
                    label="URL"
                    type="url"
                    placeholder="https://..."
                    value={content.url}
                    onChange={(event) =>
                      setForm((current) => {
                        const contents = [...current.contents] as PresentationFormState['contents']
                        contents[index] = { ...contents[index], url: event.target.value }
                        return { ...current, contents }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="CTA final"
        description="Cierra tu presentación con una llamada a la acción clara."
        emoji={PRESENTATION_EDITOR_SECTIONS.finalCta.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.finalCta.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.finalCta.guide}
      >
        <div className="space-y-5">
          <PresentationTitleInput
            label="Título"
            value={form.finalCta.title}
            onChange={(event) => updateSectionField(setForm, 'finalCta', 'title', event.target.value)}
          />
          <PresentationDescriptionTextarea
            label="Descripción"
            rows={3}
            value={form.finalCta.description}
            onChange={(event) =>
              updateSectionField(setForm, 'finalCta', 'description', event.target.value)
            }
          />
          <PresentationCtaInput
            label="Texto del botón"
            value={form.finalCta.ctaText}
            onChange={(event) =>
              updateSectionField(setForm, 'finalCta', 'ctaText', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Redes sociales"
        description="Enlaces opcionales que aparecerán en el pie de tu landing."
        emoji={PRESENTATION_EDITOR_SECTIONS.socialLinks.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.socialLinks.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.socialLinks.guide}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <PresentationUrlInput
            label="Instagram URL"
            type="url"
            placeholder="https://instagram.com/..."
            value={form.socialLinks.instagram}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'instagram', event.target.value)
            }
          />
          <PresentationUrlInput
            label="Facebook URL"
            type="url"
            placeholder="https://facebook.com/..."
            value={form.socialLinks.facebook}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'facebook', event.target.value)
            }
          />
          <PresentationUrlInput
            label="TikTok URL"
            type="url"
            placeholder="https://tiktok.com/@..."
            value={form.socialLinks.tiktok}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'tiktok', event.target.value)
            }
          />
          <PresentationUrlInput
            label="YouTube URL"
            type="url"
            placeholder="https://youtube.com/..."
            value={form.socialLinks.youtube}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'youtube', event.target.value)
            }
          />
          <PresentationUrlInput
            label="Sitio web URL"
            type="url"
            placeholder="https://..."
            value={form.socialLinks.website}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'website', event.target.value)
            }
          />
          <PresentationUrlInput
            label="WhatsApp URL"
            type="url"
            placeholder="https://wa.me/..."
            value={form.socialLinks.whatsapp}
            onChange={(event) =>
              updateSectionField(setForm, 'socialLinks', 'whatsapp', event.target.value)
            }
          />
        </div>
      </PresentationSectionCard>

      <PresentationSectionCard
        title="Formulario"
        description="Configura el formulario de contacto de tu página."
        emoji={PRESENTATION_EDITOR_SECTIONS.form.emoji}
        badge={PRESENTATION_EDITOR_SECTIONS.form.badge}
        guide={PRESENTATION_EDITOR_SECTIONS.form.guide}
      >
        <div className="space-y-5">
          <PresentationInput
            label="Título del formulario"
            value={form.formConfig.formTitle}
            maxLength={PRESENTATION_FIELD_LIMITS.formTitle}
            showCounter
            hint="brief"
            onChange={(event) =>
              updateSectionField(setForm, 'formConfig', 'formTitle', event.target.value)
            }
          />
          <PresentationTextarea
            label="Descripción del formulario"
            rows={2}
            value={form.formConfig.formDescription}
            maxLength={PRESENTATION_FIELD_LIMITS.formDescription}
            showCounter
            hint="readable"
            onChange={(event) =>
              updateSectionField(setForm, 'formConfig', 'formDescription', event.target.value)
            }
          />
          <PresentationUrlInput
            label="URL del grupo de WhatsApp"
            type="url"
            placeholder="https://chat.whatsapp.com/..."
            value={form.formConfig.whatsappGroupUrl}
            onChange={(event) =>
              updateSectionField(setForm, 'formConfig', 'whatsappGroupUrl', event.target.value)
            }
          />
          <PresentationInput
            label="Botón flotante de WhatsApp (contacto directo)"
            type="text"
            placeholder="https://wa.me/51999999999 o +51 999 999 999"
            value={form.formConfig.floatingWhatsAppUrl}
            maxLength={PRESENTATION_FIELD_LIMITS.url}
            onChange={(event) =>
              updateSectionField(setForm, 'formConfig', 'floatingWhatsAppUrl', event.target.value)
            }
            helperText="Opcional. Si lo completas, aparece un botón fijo en la esquina de tu landing para contactarte."
          />
          <PresentationInterestOptionsTextarea
            label="Opciones de interés"
            rows={5}
            value={form.formConfig.interestOptionsText}
            onChange={(value) =>
              updateSectionField(setForm, 'formConfig', 'interestOptionsText', value)
            }
          />

          <div className="rounded-xl border border-dashed border-petrol-dark/20 bg-bg-warm/60 p-5">
            <p className="mb-5 text-xs font-medium uppercase tracking-wide text-text-soft">
              Vista previa del formulario
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {presentationFormPreviewFields.map((field) => {
                if (field.key === 'message') {
                  return (
                    <div key={field.key} className="sm:col-span-2">
                      <Textarea
                        label={field.label}
                        placeholder={field.placeholder}
                        disabled
                        readOnly
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )
                }

                if (field.key === 'interest') {
                  return (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-dark">{field.label}</label>
                      <select
                        disabled
                        className="h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-soft"
                      >
                        <option>
                          {interestPreviewOptions[0] ?? field.placeholder}
                        </option>
                      </select>
                    </div>
                  )
                }

                return (
                  <Input
                    key={field.key}
                    label={field.label}
                    placeholder={field.placeholder}
                    disabled
                    readOnly
                  />
                )
              })}
            </div>
            <Button disabled className="mt-5 w-full sm:w-auto">
              Enviar (próximamente)
            </Button>
          </div>
        </div>
      </PresentationSectionCard>
    </div>
  )
}
