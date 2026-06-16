import { FileText, Presentation, Video } from 'lucide-react'
import { useState } from 'react'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/features/academy/utils/academyMediaUtils'
import { cn } from '@/lib/utils'

type AcademyMaterialMediaProps = {
  material: AcademyMaterial
}

function MaterialTypeIcon({ type, className }: { type: AcademyMaterial['type']; className?: string }) {
  if (type === 'video') {
    return <Video className={className} aria-hidden="true" />
  }

  if (type === 'pdf') {
    return <FileText className={className} aria-hidden="true" />
  }

  return <Presentation className={className} aria-hidden="true" />
}

function MediaFallback({ material }: { material: AcademyMaterial }) {
  return (
    <div
      className={cn(
        'flex aspect-video w-full items-center justify-center',
        'bg-gradient-to-br from-petrol-deep/80 via-petrol-dark/60 to-teal-accent/20',
      )}
      aria-hidden="true"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-teal-accent backdrop-blur-sm">
        <MaterialTypeIcon type={material.type} className="h-8 w-8" />
      </div>
    </div>
  )
}

export function AcademyMaterialMedia({ material }: AcademyMaterialMediaProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = material.imageUrl?.trim() ?? ''
  const showYouTubePreview = material.type === 'video' && isYouTubeUrl(material.url)
  const youtubeEmbedUrl = showYouTubePreview ? getYouTubeEmbedUrl(material.url) : null
  const showCoverImage =
    !showYouTubePreview && material.type !== 'video' && Boolean(imageUrl) && !imageFailed

  if (youtubeEmbedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-black/40">
        <iframe
          src={youtubeEmbedUrl}
          title={`Vista previa: ${material.title}`}
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  if (showCoverImage) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-petrol-deep/40">
        <img
          src={imageUrl}
          alt={`Portada de ${material.title}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  return <MediaFallback material={material} />
}
