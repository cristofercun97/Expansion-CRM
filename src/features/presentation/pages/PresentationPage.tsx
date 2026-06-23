import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PresentationEditorForm } from '@/features/presentation/components/PresentationEditorForm'
import { defaultPresentationFormState } from '@/features/presentation/constants/presentationDefaults'
import { presentationService } from '@/features/presentation/services/presentation.service'
import {
  PRESENTATION_MODULE,
  type PresentationFormState,
} from '@/features/presentation/types/presentation.types'
import { mapRecordToForm } from '@/features/presentation/utils/presentationMappers'
import {
  getPublicPresentationUrl,
  normalizeSlug,
  validateSlug,
} from '@/features/presentation/utils/slugUtils'

function logPresentationDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function PresentationPage() {
  const { showToast } = useToast()
  const { currentUser, initialized, loading: authLoading } = useAuth()

  const [form, setForm] = useState<PresentationFormState>(defaultPresentationFormState)
  const [slug, setSlug] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  const uid = currentUser?.uid
  const isBusy = loading || saving || publishing || authLoading
  const canSave = Boolean(uid) && !isBusy

  const loadPresentation = useCallback(async (ownerUid: string) => {
    setLoading(true)
    setError('')

    try {
      const record = await presentationService.getPresentationByOwner(ownerUid)

      if (record) {
        setForm(mapRecordToForm(record))
        setSlug(record.slug)
        setIsPublished(record.isPublished)
      } else {
        setForm(defaultPresentationFormState)
        setSlug('')
        setIsPublished(false)
      }
    } catch (loadError) {
      logPresentationDevError('[Presentación] Error al cargar leaderLandingPages/{uid}', loadError)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar tu presentación. Intenta nuevamente.',
      )
      setForm(defaultPresentationFormState)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    if (!uid) {
      setLoading(false)
      return
    }

    void loadPresentation(uid)
  }, [authLoading, initialized, loadPresentation, uid])

  async function handleSave() {
    if (!uid) {
      setError('Debes iniciar sesión para guardar tu presentación.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await presentationService.upsertPresentation(uid, {
        form,
        slug,
        isPublished,
      })
      showToast('Presentación guardada correctamente.', 'success')
    } catch (saveError) {
      logPresentationDevError('[Presentación] Error al guardar leaderLandingPages/{uid}', saveError)
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar tu presentación. Intenta nuevamente.'
      setError(message)
      showToast(message, 'info')
    } finally {
      setSaving(false)
    }
  }

  function handleSlugChange(value: string) {
    setSlug(normalizeSlug(value))
  }

  async function handlePublish() {
    if (!uid) {
      setError('Debes iniciar sesión para publicar tu presentación.')
      return
    }

    const validationError = validateSlug(slug)
    if (validationError) {
      setError(validationError)
      showToast(validationError, 'info')
      return
    }

    setPublishing(true)
    setError('')

    try {
      await presentationService.upsertPresentation(uid, {
        form,
        slug,
        isPublished: false,
      })
      const publishedSlug = await presentationService.publishPresentation(uid, slug)
      setSlug(publishedSlug)
      setIsPublished(true)
      showToast('Presentación publicada correctamente.', 'success')
    } catch (publishError) {
      logPresentationDevError('[Presentación] Error al publicar', publishError)
      const message =
        publishError instanceof Error
          ? publishError.message
          : 'No pudimos publicar tu presentación. Intenta nuevamente.'
      setError(message)
      showToast(message, 'info')
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!uid) {
      return
    }

    setPublishing(true)
    setError('')

    try {
      await presentationService.unpublishPresentation(uid)
      setIsPublished(false)
      showToast('Presentación despublicada.', 'success')
    } catch (unpublishError) {
      logPresentationDevError('[Presentación] Error al despublicar', unpublishError)
      const message =
        unpublishError instanceof Error
          ? unpublishError.message
          : 'No pudimos despublicar tu presentación. Intenta nuevamente.'
      setError(message)
      showToast(message, 'info')
    } finally {
      setPublishing(false)
    }
  }

  async function handleCopyLink() {
    const validationError = validateSlug(slug)
    if (validationError) {
      showToast(validationError, 'info')
      return
    }

    try {
      await navigator.clipboard.writeText(getPublicPresentationUrl(slug))
      showToast('Enlace copiado al portapapeles.', 'success')
    } catch {
      showToast('No pudimos copiar el enlace.', 'info')
    }
  }

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-8 py-8">
        <p className="text-center text-sm text-hero-text/70">
          Debes iniciar sesión para configurar tu presentación.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-8 max-w-3xl">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-hero-text/70 transition-colors hover:text-gold-light"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al panel
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-hero-text">
          {PRESENTATION_MODULE.title}
        </h1>
        <p className="mt-2 text-base text-teal-accent">{PRESENTATION_MODULE.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-hero-text/70">
          {PRESENTATION_MODULE.description}
        </p>
      </header>

      {loading ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando tu presentación...
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur-sm">
          {error}
        </p>
      ) : null}

      <fieldset disabled={isBusy} className="disabled:opacity-90">
        <PresentationEditorForm
          form={form}
          setForm={setForm}
          ownerUid={uid}
          isBusy={isBusy}
          publishing={publishing}
          isPublished={isPublished}
          slug={slug}
          onSlugChange={handleSlugChange}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onCopyLink={handleCopyLink}
        />

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="gap-2 bg-gold text-petrol-deep hover:bg-gold-light"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </fieldset>
    </div>
  )
}
