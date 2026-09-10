import { httpsCallable } from 'firebase/functions'
import { getFunctions } from 'firebase/functions'
import { getFirebaseApp } from '@/lib/firebase'

export type PublicBookingProfessional = {
  displayName: string
  avatarUrl: string | null
  brandName: string | null
  claim: string | null
}

export type PublicBookingAvailability = {
  professional: PublicBookingProfessional
  professionalName: string
  bookingTitle: string
  bookingDescription: string
  timezone: string
  durationMinutes: number
  dates: Record<string, string[]>
}

export type PublicBookingLeadInput = {
  firstName: string
  lastName: string
  email: string
  country: string
  city: string
  whatsapp: string
  sessionReason: string
  objective: string
  message: string
  privacyAccepted: boolean
}

export type PublicBookingConfirmation = {
  bookingId: string
  professionalName: string
  date: string
  time: string
  timezone: string
  duration: number
  meetingMode: string
  googleMeetAvailable: boolean
  idempotent?: boolean
}

function getExpansionFunctions() {
  return getFunctions(getFirebaseApp(), 'europe-west1')
}

function mapCallableError(error: unknown): Error {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code || '')
      : ''
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message || '')
      : ''

  if (code.includes('not-found')) {
    return new Error('not-found')
  }
  if (
    message.toLowerCase().includes('no están disponibles') ||
    message.toLowerCase().includes('booking_disabled')
  ) {
    return new Error('booking_disabled')
  }
  if (message.includes('acaba de reservarse') || code.includes('failed-precondition')) {
    if (message.toLowerCase().includes('privacidad')) {
      return new Error('privacy_required')
    }
    if (message.toLowerCase().includes('31')) {
      return new Error('range_too_large')
    }
    if (
      message.includes('acaba de reservarse') ||
      message.includes('ya no está disponible')
    ) {
      return new Error('slot_taken')
    }
    if (message.toLowerCase().includes('no están disponibles')) {
      return new Error('booking_disabled')
    }
  }
  if (message.toLowerCase().includes('31')) {
    return new Error('range_too_large')
  }
  return new Error('temporary')
}

async function getPublicBookingAvailability(input: {
  slug: string
  dateFrom: string
  dateTo: string
}): Promise<PublicBookingAvailability> {
  try {
    const fn = httpsCallable(getExpansionFunctions(), 'getPublicBookingAvailability')
    const result = await fn(input)
    return result.data as PublicBookingAvailability
  } catch (error) {
    throw mapCallableError(error)
  }
}

async function createPublicBooking(input: {
  slug: string
  selectedDate: string
  selectedTime: string
  clientRequestId: string
  leadData: PublicBookingLeadInput
}): Promise<PublicBookingConfirmation> {
  try {
    const fn = httpsCallable(getExpansionFunctions(), 'createPublicBooking')
    const result = await fn(input)
    return result.data as PublicBookingConfirmation
  } catch (error) {
    throw mapCallableError(error)
  }
}

export const publicBookingService = {
  getPublicBookingAvailability,
  createPublicBooking,
}

export const SESSION_REASON_OPTIONS = [
  'Desarrollo personal',
  'Bienestar emocional',
  'Objetivos profesionales',
  'Liderazgo',
  'Otro',
] as const

export const SESSION_OBJECTIVE_OPTIONS = [
  'Clarificar mi situación',
  'Definir próximos pasos',
  'Resolver una dificultad',
  'Conocer el proceso',
  'Otro',
] as const
