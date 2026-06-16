import { Loader2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { presentationFormPreviewFields } from '@/features/presentation/constants/presentationDefaults'
import { presentationProspectsService, getPresentationProspectSubmitErrorMessage } from '@/features/presentation/services/prospects.service'
import type { PresentationFormConfig } from '@/features/presentation/types/presentation.types'
import type { PresentationProspectFormValues } from '@/features/presentation/types/prospect.types'
import {
  buildPresentationProspectPayload,
  getPresentationInterestOptions,
  hasEnabledPresentationFormFields,
  hasPresentationProspectFormErrors,
  validatePresentationProspectForm,
} from '@/features/presentation/utils/presentationProspectUtils'
import { cn } from '@/lib/utils'

type PresentationPublicFormProps = {
  formConfig: PresentationFormConfig
  ownerUid: string
  landingSlug: string
}

const inputClassName =
  'h-11 rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-[#4A4A46] transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClassName =
  'resize-none rounded-lg border border-petrol-dark/15 bg-white px-3 py-2.5 text-sm text-[#4A4A46] transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

function getSubmitErrorMessage(error: unknown): string {
  return getPresentationProspectSubmitErrorMessage(error)
}

export function PresentationPublicForm({
  formConfig,
  ownerUid,
  landingSlug,
}: PresentationPublicFormProps) {
  const interestOptions = useMemo(
    () => getPresentationInterestOptions(formConfig.interestOptionsText),
    [formConfig.interestOptionsText],
  )

  const [values, setValues] = useState<PresentationProspectFormValues>({
    name: '',
    whatsapp: '',
    interest: '',
    message: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const whatsappGroupUrl = formConfig.whatsappGroupUrl.trim()
  const formEnabled = hasEnabledPresentationFormFields(formConfig)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || isSubmitted || !formEnabled) {
      return
    }

    const errors = validatePresentationProspectForm(formConfig, values)

    if (hasPresentationProspectFormErrors(errors)) {
      setFieldErrors(errors)
      setSubmitError(errors.form ?? '')
      return
    }

    setFieldErrors({})
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const payload = buildPresentationProspectPayload(formConfig, values, {
        ownerUid,
        landingSlug,
      })

      await presentationProspectsService.createPresentationProspect(payload)
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div
        className="space-y-5 rounded-2xl border border-petrol-dark/10 bg-white p-6 text-center text-[#4A4A46] shadow-xl sm:p-8"
        role="status"
        aria-live="polite"
      >
        <p className="text-xl font-semibold text-[#071B25]">
          Gracias, hemos recibido tu información.
        </p>
        <p className="text-base leading-relaxed">Pronto nos pondremos en contacto contigo.</p>
        {whatsappGroupUrl ? (
          <a
            href={whatsappGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold transition-opacity hover:opacity-90 sm:w-auto sm:min-w-[280px] sm:px-8"
            style={{
              backgroundColor: 'var(--preview-button-bg)',
              color: 'var(--preview-button-text)',
            }}
          >
            Unirme al grupo de WhatsApp
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-petrol-dark/10 bg-white p-6 text-[#4A4A46] shadow-xl sm:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      {submitError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      {!formEnabled ? (
        <p className="text-sm text-[#4A4A46]">Este formulario no está disponible en este momento.</p>
      ) : null}

      {formConfig.nameEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="presentation-prospect-name" className="text-sm font-medium text-[#071B25]">
            {presentationFormPreviewFields[0].label}
            <span className="text-red-600" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id="presentation-prospect-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            disabled={isSubmitting}
            placeholder={presentationFormPreviewFields[0].placeholder}
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'presentation-prospect-name-error' : undefined}
            className={cn(inputClassName, fieldErrors.name && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
          />
          {fieldErrors.name ? (
            <p id="presentation-prospect-name-error" className="text-xs text-red-600">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
      ) : null}

      {formConfig.whatsappEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="presentation-prospect-whatsapp"
            className="text-sm font-medium text-[#071B25]"
          >
            {presentationFormPreviewFields[1].label}
            <span className="text-red-600" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id="presentation-prospect-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            required
            minLength={6}
            inputMode="tel"
            disabled={isSubmitting}
            placeholder={presentationFormPreviewFields[1].placeholder}
            value={values.whatsapp}
            onChange={(event) =>
              setValues((current) => ({ ...current, whatsapp: event.target.value }))
            }
            aria-invalid={Boolean(fieldErrors.whatsapp)}
            aria-describedby={
              fieldErrors.whatsapp ? 'presentation-prospect-whatsapp-error' : undefined
            }
            className={cn(
              inputClassName,
              fieldErrors.whatsapp && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            )}
          />
          {fieldErrors.whatsapp ? (
            <p id="presentation-prospect-whatsapp-error" className="text-xs text-red-600">
              {fieldErrors.whatsapp}
            </p>
          ) : null}
        </div>
      ) : null}

      {formConfig.interestEnabled ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="presentation-prospect-interest"
            className="text-sm font-medium text-[#071B25]"
          >
            {presentationFormPreviewFields[2].label}
            <span className="text-red-600" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <select
            id="presentation-prospect-interest"
            name="interest"
            required
            disabled={isSubmitting}
            value={values.interest}
            onChange={(event) =>
              setValues((current) => ({ ...current, interest: event.target.value }))
            }
            aria-invalid={Boolean(fieldErrors.interest)}
            aria-describedby={
              fieldErrors.interest ? 'presentation-prospect-interest-error' : undefined
            }
            className={cn(
              inputClassName,
              fieldErrors.interest && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            )}
          >
            <option value="" disabled>
              {presentationFormPreviewFields[2].placeholder}
            </option>
            {interestOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.interest ? (
            <p id="presentation-prospect-interest-error" className="text-xs text-red-600">
              {fieldErrors.interest}
            </p>
          ) : null}
        </div>
      ) : null}

      {formConfig.messageEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="presentation-prospect-message"
            className="text-sm font-medium text-[#071B25]"
          >
            {presentationFormPreviewFields[3].label}
          </label>
          <textarea
            id="presentation-prospect-message"
            name="message"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
            placeholder={presentationFormPreviewFields[3].placeholder}
            value={values.message}
            onChange={(event) =>
              setValues((current) => ({ ...current, message: event.target.value }))
            }
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? 'presentation-prospect-message-error' : undefined}
            className={cn(
              textareaClassName,
              fieldErrors.message && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            )}
          />
          {fieldErrors.message ? (
            <p id="presentation-prospect-message-error" className="text-xs text-red-600">
              {fieldErrors.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !formEnabled}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: 'var(--preview-button-bg)',
          color: 'var(--preview-button-text)',
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          'Enviar'
        )}
      </button>
    </form>
  )
}
