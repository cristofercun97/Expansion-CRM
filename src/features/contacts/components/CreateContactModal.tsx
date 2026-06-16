import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { CONTACT_STATUS_OPTIONS } from '@/features/contacts/utils/contactStatusLabels'
import {
  DEFAULT_MANUAL_CONTACT_FORM,
  hasManualContactFormErrors,
  validateManualContactForm,
  type ManualContactFormErrors,
  type ManualContactFormValues,
} from '@/features/contacts/utils/manualContactForm'

type CreateContactModalProps = {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ManualContactFormValues) => Promise<void>
}

const selectClassName =
  'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

export function CreateContactModal({ open, isSubmitting, onClose, onSubmit }: CreateContactModalProps) {
  const [values, setValues] = useState<ManualContactFormValues>(DEFAULT_MANUAL_CONTACT_FORM)
  const [fieldErrors, setFieldErrors] = useState<ManualContactFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(DEFAULT_MANUAL_CONTACT_FORM)
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
  }, [isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateManualContactForm(values)

    if (hasManualContactFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos agregar el contacto. Intenta nuevamente.',
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
        aria-labelledby="create-contact-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-contact-title" className="text-xl font-semibold text-text-dark">
              Agregar contacto
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              Registra manualmente una persona en tu lista de contactos.
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
            label="Nombre"
            name="name"
            value={values.name}
            required
            minLength={2}
            disabled={isSubmitting}
            error={fieldErrors.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />

          <Input
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            value={values.whatsapp}
            required
            disabled={isSubmitting}
            error={fieldErrors.whatsapp}
            placeholder="+51 999 999 999"
            onChange={(event) =>
              setValues((current) => ({ ...current, whatsapp: event.target.value }))
            }
          />

          <Input
            label="Interés"
            name="interest"
            value={values.interest}
            disabled={isSubmitting}
            helperText="Opcional"
            onChange={(event) =>
              setValues((current) => ({ ...current, interest: event.target.value }))
            }
          />

          <Textarea
            label="Mensaje / Nota"
            name="message"
            rows={3}
            maxLength={500}
            value={values.message}
            disabled={isSubmitting}
            error={fieldErrors.message}
            helperText="Opcional. Máximo 500 caracteres."
            onChange={(event) =>
              setValues((current) => ({ ...current, message: event.target.value }))
            }
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="manual-contact-status" className="text-sm font-medium text-text-dark">
              Estado inicial
            </label>
            <select
              id="manual-contact-status"
              name="status"
              value={values.status}
              disabled={isSubmitting}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as ManualContactFormValues['status'],
                }))
              }
              className={selectClassName}
            >
              {CONTACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Guardar contacto'
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
