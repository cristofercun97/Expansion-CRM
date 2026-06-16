import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PresentationPreviewLanding } from '@/features/presentation/components/preview/PresentationPreviewLanding'
import { presentationService } from '@/features/presentation/services/presentation.service'
import type { PresentationFormState } from '@/features/presentation/types/presentation.types'
import { mapRecordToForm } from '@/features/presentation/utils/presentationMappers'

type PublicPresentationContext = {
  form: PresentationFormState
  ownerUid: string
  landingSlug: string
}

function logPresentationDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

export function PublicPresentationPage() {
  const { slug } = useParams<{ slug: string }>()
  const [presentation, setPresentation] = useState<PublicPresentationContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    presentationService
      .getPublishedPresentationBySlug(slug)
      .then((record) => {
        if (cancelled) {
          return
        }

        setPresentation(
          record
            ? {
                form: mapRecordToForm(record),
                ownerUid: record.ownerUid,
                landingSlug: record.slug,
              }
            : null,
        )
      })
      .catch((error) => {
        logPresentationDevError('[Presentación] Error al cargar landing pública', error)
        if (!cancelled) {
          setPresentation(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-bg px-6">
        <p className="flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando presentación...
        </p>
      </div>
    )
  }

  if (!presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-bg px-6">
        <div className="max-w-md text-center">
          <p className="text-xl font-semibold text-hero-text">
            Esta presentación no está disponible.
          </p>
          <p className="mt-3 text-sm text-hero-text/70">
            El enlace no existe o la página aún no ha sido publicada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PresentationPreviewLanding
      form={presentation.form}
      publicContext={{
        ownerUid: presentation.ownerUid,
        landingSlug: presentation.landingSlug,
      }}
    />
  )
}
