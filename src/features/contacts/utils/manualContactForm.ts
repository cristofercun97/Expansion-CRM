import type { ContactStatus } from '@/features/contacts/types/contact.types'
import { isValidWhatsappNumber } from '@/features/contacts/utils/whatsapp'

export type ManualContactFormValues = {
  name: string
  whatsapp: string
  interest: string
  message: string
  status: ContactStatus
}

export type ManualContactFormErrors = Partial<Record<keyof ManualContactFormValues, string>>

export const DEFAULT_MANUAL_CONTACT_FORM: ManualContactFormValues = {
  name: '',
  whatsapp: '',
  interest: '',
  message: '',
  status: 'new',
}

const MESSAGE_MAX_LENGTH = 500

export function validateManualContactForm(
  values: ManualContactFormValues,
): ManualContactFormErrors {
  const errors: ManualContactFormErrors = {}
  const name = values.name.trim()
  const message = values.message.trim()

  if (name.length < 2) {
    errors.name = 'Ingresa un nombre (mínimo 2 caracteres).'
  }

  if (!isValidWhatsappNumber(values.whatsapp)) {
    errors.whatsapp = 'Ingresa un WhatsApp válido (mínimo 6 dígitos).'
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    errors.message = `El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres.`
  }

  return errors
}

export function hasManualContactFormErrors(errors: ManualContactFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export type CreateManualContactInput = {
  name: string
  whatsapp: string
  interest?: string
  message?: string
  status?: ContactStatus
}

export function buildManualContactInput(
  values: ManualContactFormValues,
): CreateManualContactInput {
  const input: CreateManualContactInput = {
    name: values.name.trim(),
    whatsapp: values.whatsapp.trim(),
    status: values.status,
  }

  const interest = values.interest.trim()
  const message = values.message.trim()

  if (interest) {
    input.interest = interest
  }

  if (message) {
    input.message = message
  }

  return input
}
