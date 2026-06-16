import { defaultInterestOptionsText } from '@/features/presentation/constants/presentationDefaults'
import type { PresentationFormConfig } from '@/features/presentation/types/presentation.types'
import type {
  CreatePresentationProspectInput,
  PresentationProspectFormErrors,
  PresentationProspectFormValues,
} from '@/features/presentation/types/prospect.types'

const MESSAGE_MAX_LENGTH = 500

export function getPresentationInterestOptions(interestOptionsText: string): string[] {
  const parsed = interestOptionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (parsed.length > 0) {
    return parsed
  }

  return defaultInterestOptionsText.split('\n').map((line) => line.trim()).filter(Boolean)
}

export function hasEnabledPresentationFormFields(formConfig: PresentationFormConfig): boolean {
  return (
    formConfig.nameEnabled ||
    formConfig.whatsappEnabled ||
    formConfig.interestEnabled ||
    formConfig.messageEnabled
  )
}

export function validatePresentationProspectForm(
  formConfig: PresentationFormConfig,
  values: PresentationProspectFormValues,
): PresentationProspectFormErrors {
  const errors: PresentationProspectFormErrors = {}
  const name = values.name.trim()
  const whatsapp = values.whatsapp.trim()
  const interest = values.interest.trim()
  const message = values.message.trim()

  if (!hasEnabledPresentationFormFields(formConfig)) {
    errors.form = 'Este formulario no está disponible en este momento.'
    return errors
  }

  if (formConfig.nameEnabled) {
    if (name.length < 2) {
      errors.name = 'Ingresa tu nombre (mínimo 2 caracteres).'
    }
  }

  if (formConfig.whatsappEnabled) {
    if (whatsapp.length < 6) {
      errors.whatsapp = 'Ingresa un número de WhatsApp válido (mínimo 6 caracteres).'
    }
  }

  if (formConfig.interestEnabled) {
    if (!interest) {
      errors.interest = 'Selecciona una opción de interés.'
    }
  }

  if (formConfig.messageEnabled && message.length > MESSAGE_MAX_LENGTH) {
    errors.message = `El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres.`
  }

  const hasAnyValue =
    (formConfig.nameEnabled && name.length > 0) ||
    (formConfig.whatsappEnabled && whatsapp.length > 0) ||
    (formConfig.interestEnabled && interest.length > 0) ||
    (formConfig.messageEnabled && message.length > 0)

  if (!hasAnyValue) {
    errors.form = 'Completa al menos un campo antes de enviar.'
  }

  return errors
}

export function buildPresentationProspectPayload(
  formConfig: PresentationFormConfig,
  values: PresentationProspectFormValues,
  context: { ownerUid: string; landingSlug: string },
): CreatePresentationProspectInput {
  const payload: CreatePresentationProspectInput = {
    ownerUid: context.ownerUid.trim(),
    leaderId: context.ownerUid.trim(),
    landingSlug: context.landingSlug.trim(),
  }

  if (formConfig.nameEnabled) {
    payload.name = values.name.trim()
  }

  if (formConfig.whatsappEnabled) {
    payload.whatsapp = values.whatsapp.trim()
  }

  if (formConfig.interestEnabled) {
    payload.interest = values.interest.trim()
  }

  if (formConfig.messageEnabled) {
    const message = values.message.trim()
    if (message) {
      payload.message = message
    }
  }

  const whatsappGroupUrl = formConfig.whatsappGroupUrl.trim()
  if (whatsappGroupUrl) {
    payload.whatsappGroupUrl = whatsappGroupUrl
  }

  return payload
}

export function hasPresentationProspectFormErrors(
  errors: PresentationProspectFormErrors,
): boolean {
  return Object.keys(errors).length > 0
}
