import { ArrowLeft, Edit3, Eye, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PresentationPreviewLanding } from '@/features/presentation/components/preview/PresentationPreviewLanding'
import { presentationService } from '@/features/presentation/services/presentation.service'
import {
  PRESENTATION_MODULE,
  type PresentationFormState,
} from '@/features/presentation/types/presentation.types'
import { mapRecordToForm } from '@/features/presentation/utils/presentationMappers'

function logPresentationDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function PresentationPreviewPage() {
  const { currentUser, initialized, loading: authLoading } = useAuth()
  const [form, setForm] = useState<PresentationFormState | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasSavedData, setHasSavedData] = useState(false)

  const uid = currentUser?.uid

  const loadPreview = useCallback(async (ownerUid: string) => {
    setLoading(true)
    setError('')

    try {
      const record = await presentationService.getPresentationByOwner(ownerUid)

      if (record) {
        setForm(mapRecordToForm(record))
        setIsPublished(record.isPublished)
        setHasSavedData(true)
      } else {
        setForm(null)
        setIsPublished(false)
        setHasSavedData(false)
      }
    } catch (loadError) {
      logPresentationDevError('[Presentación] Error al cargar vista previa', loadError)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos cargar la vista previa. Intenta nuevamente.',
      )
      setForm(null)
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

    void loadPreview(uid)
  }, [authLoading, initialized, loadPreview, uid])

  if (initialized && !authLoading && !currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-center text-sm text-hero-text/70">
          Debes iniciar sesión para ver la vista previa.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-bg">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-petrol-deep/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-hero-text/80">
            <Eye className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            <span className="font-medium">
              {isPublished ? 'Vista previa interna' : 'Vista previa interna — No publicada'}
            </span>
          </div>

          <Link to={PRESENTATION_MODULE.route}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-white/20 bg-transparent text-hero-text hover:bg-white/10"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              Volver a editar
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando vista previa...
          </p>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
          <Link to={PRESENTATION_MODULE.route} className="mt-6 inline-block">
            <Button variant="outline" className="gap-2 border-white/20 text-hero-text">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a editar
            </Button>
          </Link>
        </div>
      ) : !hasSavedData || !form ? (
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <p className="text-lg font-medium text-hero-text">
            Aún no tienes una presentación guardada
          </p>
          <p className="mt-3 text-sm leading-relaxed text-hero-text/70">
            Configura tu presentación y pulsa <strong className="text-hero-text">Guardar cambios</strong>{' '}
            para ver cómo se verá tu landing.
          </p>
          <Link to={PRESENTATION_MODULE.route} className="mt-8 inline-block">
            <Button className="gap-2 bg-gold text-petrol-deep hover:bg-gold-light">
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              Ir a editar presentación
            </Button>
          </Link>
        </div>
      ) : (
        <PresentationPreviewLanding form={form} />
      )}
    </div>
  )
}
