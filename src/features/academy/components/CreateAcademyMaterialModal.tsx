import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { AcademyMaterial, CreateAcademyMaterialInput } from '@/features/academy/types/academy.types'
import { ACADEMY_MATERIAL_TYPE_OPTIONS } from '@/features/academy/utils/academyMaterialLabels'
import {
  buildAcademyMaterialFormFromMaterial,
  DEFAULT_ACADEMY_MATERIAL_FORM,
  hasAcademyMaterialFormErrors,
  validateAcademyMaterialForm,
  type AcademyMaterialFormErrors,
  type AcademyMaterialFormValues,
} from '@/features/academy/utils/academyMaterialForm'

type CreateAcademyMaterialModalProps = {
  open: boolean
  material?: AcademyMaterial | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: CreateAcademyMaterialInput) => Promise<void>
}

const selectClassName =
  'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

export function CreateAcademyMaterialModal({
  open,
  material = null,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateAcademyMaterialModalProps) {
  const isEditing = material !== null
  const [values, setValues] = useState<AcademyMaterialFormValues>(DEFAULT_ACADEMY_MATERIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<AcademyMaterialFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(material ? buildAcademyMaterialFormFromMaterial(material) : DEFAULT_ACADEMY_MATERIAL_FORM)
    setFieldErrors({})
    setSubmitError('')

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSubmitting, material, onClose, open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateAcademyMaterialForm(values)

    if (hasAcademyMaterialFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        type: values.type as CreateAcademyMaterialInput['type'],
        url: values.url.trim(),
        imageUrl: values.imageUrl.trim() || undefined,
        isActive: values.isActive,
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar el material. Intenta nuevamente.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar formulario"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-material-form-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="academy-material-form-title" className="text-xl font-semibold text-text-dark">
              {isEditing ? 'Editar material' : 'Agregar material'}
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              {isEditing
                ? 'Actualiza los datos de tu material de capacitación.'
                : 'Comparte un enlace de presentación, PDF o video para tu equipo.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-text-soft transition-colors hover:bg-petrol-dark/5 hover:text-text-dark disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {submitError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <Input
            label="Título"
            name="title"
            value={values.title}
            required
            minLength={3}
            disabled={isSubmitting}
            error={fieldErrors.title}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          />

          <Textarea
            label="Descripción"
            name="description"
            rows={3}
            value={values.description}
            disabled={isSubmitting}
            helperText="Opcional. Resume de qué trata el material."
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="academy-material-type" className="text-sm font-medium text-text-dark">
              Tipo de material
            </label>
            <select
              id="academy-material-type"
              name="type"
              value={values.type}
              required
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  type: event.target.value as AcademyMaterialFormValues['type'],
                }))
              }
              className={selectClassName}
            >
              <option value="" disabled>
                Selecciona un tipo
              </option>
              {ACADEMY_MATERIAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.type ? (
              <p className="text-sm text-red-600">{fieldErrors.type}</p>
            ) : null}
          </div>

          <Input
            label="URL del recurso"
            name="url"
            type="url"
            value={values.url}
            required
            disabled={isSubmitting}
            error={fieldErrors.url}
            placeholder="https://..."
            helperText="Google Drive, Slides, PDF externo o YouTube."
            onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
          />

          <Input
            label="URL de portada"
            name="imageUrl"
            type="url"
            value={values.imageUrl}
            disabled={isSubmitting}
            error={fieldErrors.imageUrl}
            placeholder="https://..."
            helperText="Opcional. Imagen de portada para presentaciones y PDF."
            onChange={(event) =>
              setValues((current) => ({ ...current, imageUrl: event.target.value }))
            }
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-petrol-dark/10 bg-petrol-dark/5 px-3 py-3">
            <input
              type="checkbox"
              name="isActive"
              checked={values.isActive}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({ ...current, isActive: event.target.checked }))
              }
              className="h-4 w-4 rounded border-petrol-dark/20 text-teal focus:ring-teal/30"
            />
            <span className="text-sm text-text-dark">
              Material activo (visible para tu equipo cuando publiquemos la academia)
            </span>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : isEditing ? (
                'Guardar cambios'
              ) : (
                'Guardar material'
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
