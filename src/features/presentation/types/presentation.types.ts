import type { Timestamp } from 'firebase/firestore'

export type PresentationTextColor = 'white' | 'black' | 'gray'

export type PresentationBackgroundMode = 'solid' | 'gradient'

export type PresentationVisualIdentity = {
  logoUrl: string
  photoUrl: string
  brandName: string
  backgroundColor: string
  backgroundMode: PresentationBackgroundMode
  gradientEndColor: string
  headerBackgroundColor: string
  headerButtonColor: string
  headerButtonTextColor: PresentationTextColor
  headingTextColor: PresentationTextColor
  bodyTextColor: PresentationTextColor
  /** Texto del botón del header. */
  headerCtaText: string
  /** Enlace opcional del botón del header. Vacío = ir al formulario. */
  headerCtaUrl: string
}

export type PresentationMainMessage = {
  valuePhrase: string
  subtitle: string
  ctaText: string
  /** Enlace opcional del botón principal. Vacío = ir al formulario. */
  ctaUrl: string
}

export type PresentationMainMessageFirestore = {
  valueTitle: string
  subtitle: string
  ctaText: string
  ctaUrl: string
}

export type PresentationTextSection = {
  title: string
  description: string
}

export type PresentationLeadMagnet = {
  title: string
  description: string
  ctaText: string
  resourceUrl: string
}

/** Public booking config (Presentación ↔ Agenda Fase 1). */
export type PresentationBookingConfig = {
  enabled: boolean
  durationMinutes: number
  timezone: string
  title: string
  description: string
  googleMeet: boolean
}

export type PresentationMethodStep = {
  title: string
  description: string
}

export type PresentationMethod = {
  title: string
  steps: [PresentationMethodStep, PresentationMethodStep, PresentationMethodStep]
}

export type PresentationSocialProof = {
  testimonialName: string
  testimonialText: string
  proofUrl: string
}

export type PresentationVideos = {
  youtubeShortUrl: string
  tiktokUrl: string
}

export type PresentationService = {
  title: string
  description: string
  ctaText: string
  /** Enlace opcional del botón. Vacío = ir al formulario. */
  ctaUrl: string
}

export type PresentationContentType = 'video' | 'artículo' | 'entrevista' | 'post'

export type PresentationContentItem = {
  title: string
  type: PresentationContentType
  url: string
}

export type PresentationFinalCta = {
  title: string
  description: string
  ctaText: string
  /** Enlace opcional del botón. Vacío = ir al formulario. */
  ctaUrl: string
}

export type PresentationFormPreview = {
  nameEnabled: boolean
  whatsappEnabled: boolean
  countryEnabled: boolean
  cityEnabled: boolean
  interestEnabled: boolean
  messageEnabled: boolean
}

export type PresentationFormConfig = PresentationFormPreview & {
  formTitle: string
  formDescription: string
  whatsappGroupUrl: string
  /** Botón flotante de contacto directo (wa.me). Vacío = oculto. */
  floatingWhatsAppUrl: string
  /** Una opción por línea en la UI; se persiste como array en Firestore. */
  interestOptionsText: string
}

export type PresentationSocialLinks = {
  instagram: string
  facebook: string
  tiktok: string
  youtube: string
  website: string
  whatsapp: string
}

export type PresentationFormState = {
  visualIdentity: PresentationVisualIdentity
  mainMessage: PresentationMainMessage
  problem: PresentationTextSection
  promise: PresentationTextSection
  leadMagnet: PresentationLeadMagnet
  story: PresentationTextSection
  method: PresentationMethod
  socialProof: PresentationSocialProof
  videos: PresentationVideos
  services: [PresentationService, PresentationService, PresentationService]
  contents: [PresentationContentItem, PresentationContentItem, PresentationContentItem]
  finalCta: PresentationFinalCta
  formConfig: PresentationFormConfig
  socialLinks: PresentationSocialLinks
  booking: PresentationBookingConfig
}

export type PresentationFormConfigFirestore = PresentationFormPreview & {
  formTitle: string
  formDescription: string
  whatsappGroupUrl: string
  floatingWhatsAppUrl: string
  interestOptions: string[]
}

export type PresentationRecord = {
  ownerUid: string
  slug: string
  isPublished: boolean
  form: PresentationFormState
  /** Owner-only funnel counters (server-maintained). */
  bookingFunnel?: {
    views: number
    bookingClicks: number
    bookings: number
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type PresentationFirestorePayload = {
  ownerUid: string
  leaderId: string
  slug: string
  isPublished: boolean
  visualIdentity: PresentationVisualIdentity
  mainMessage: PresentationMainMessageFirestore
  problem: PresentationTextSection
  promise: PresentationTextSection
  leadMagnet: PresentationLeadMagnet
  story: PresentationTextSection
  method: PresentationMethod
  socialProof: PresentationSocialProof
  videos: PresentationVideos
  services: PresentationService[]
  contents: PresentationContentItem[]
  finalCta: PresentationFinalCta
  formConfig: PresentationFormConfigFirestore
  formPreview: PresentationFormPreview
  socialLinks: PresentationSocialLinks
  booking: PresentationBookingConfig
}

export type PresentationUpsertInput = {
  form: PresentationFormState
  slug: string
  isPublished: boolean
}

export const PRESENTATION_TEXT_COLORS = ['white', 'black', 'gray'] as const

export const PRESENTATION_MODULE = {
  title: 'Presentación',
  subtitle: 'Expande tu marca personal',
  description:
    'Configura tu landing paso a paso: identidad, mensaje, historia, oferta y formulario para conectar con personas interesadas.',
  route: '/dashboard/presentacion',
  previewRoute: '/dashboard/presentacion/vista-previa',
} as const

export const PRESENTATION_CONTENT_TYPES: PresentationContentType[] = [
  'video',
  'artículo',
  'entrevista',
  'post',
]
