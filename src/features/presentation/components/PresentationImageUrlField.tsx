import { ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui'
import { PresentationUrlInput } from '@/features/presentation/components/PresentationFormFields'
import { uploadPresentationImage } from '@/features/presentation/services/presentation-image.service'
import type { PresentationImageKind } from '@/features/presentation/services/presentation-image.service'
import { cn } from '@/lib/utils'

type PresentationImageUrlFieldProps = {
  label: string
  value: string
  ownerUid?: string
  imageKind: PresentationImageKind
  placeholder?: string
  previewClassName?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function PresentationImageUrlField({
  label,
  value,
  ownerUid,
  imageKind,
  placeholder,
  previewClassName,
  disabled = false,
  onChange,
}: PresentationImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !ownerUid) {
      return
    }

    setUploadError('')
    setUploading(true)

    try {
      const downloadUrl = await uploadPresentationImage(ownerUid, imageKind, file)
      onChange(downloadUrl)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const trimmedValue = value.trim()
  const isRoundPreview = imageKind === 'photo'

  return (
    <div className="space-y-3">
      <PresentationUrlInput
        label={label}
        type="url"
        placeholder={placeholder}
        value={value}
        disabled={disabled || uploading}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3">
        {trimmedValue ? (
          <img
            src={trimmedValue}
            alt=""
            className={cn(
              'border border-petrol-dark/15 bg-white object-cover',
              isRoundPreview ? 'h-14 w-14 rounded-full' : 'h-14 max-w-[120px] rounded-lg object-contain p-1',
              previewClassName,
            )}
          />
        ) : (
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center border border-dashed border-petrol-dark/20 bg-white/80 text-text-soft',
              isRoundPreview ? 'rounded-full' : 'rounded-lg',
            )}
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading || !ownerUid}
            className="border-petrol-dark/15 bg-white text-text-dark hover:bg-petrol-dark/5"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {uploading ? 'Subiendo...' : 'Subir desde el equipo'}
          </Button>
          <p className="text-xs text-text-soft">JPG, PNG, WEBP o GIF. Máximo 5 MB.</p>
          {!ownerUid ? (
            <p className="text-xs text-amber-700">Inicia sesión para subir imágenes.</p>
          ) : null}
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
