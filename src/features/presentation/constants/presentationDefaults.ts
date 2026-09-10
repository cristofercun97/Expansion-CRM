import type {
  PresentationContentItem,
  PresentationFormState,
  PresentationMethodStep,
  PresentationService,
} from '@/features/presentation/types/presentation.types'

const emptyTextSection = { title: '', description: '' } as const

const defaultMethodSteps: [PresentationMethodStep, PresentationMethodStep, PresentationMethodStep] = [
  { title: '', description: '' },
  { title: '', description: '' },
  { title: '', description: '' },
]

const defaultServices: [PresentationService, PresentationService, PresentationService] = [
  { title: 'Diagnóstico', description: '', ctaText: 'Solicitar diagnóstico', ctaUrl: '' },
  { title: 'Mentoría', description: '', ctaText: 'Agendar mentoría', ctaUrl: '' },
  { title: 'Conferencia', description: '', ctaText: 'Reservar conferencia', ctaUrl: '' },
]

const defaultContents: [
  PresentationContentItem,
  PresentationContentItem,
  PresentationContentItem,
] = [
  { title: '', type: 'video', url: '' },
  { title: '', type: 'artículo', url: '' },
  { title: '', type: 'entrevista', url: '' },
]

export const defaultInterestOptionsText = [
  'Quiero más información',
  'Quiero iniciar el proyecto',
  'Quiero una llamada',
  'Quiero recibir la guía',
].join('\n')

export const defaultPresentationFormState: PresentationFormState = {
  visualIdentity: {
    logoUrl: '',
    photoUrl: '',
    brandName: '',
    backgroundColor: '#062f36',
    backgroundMode: 'solid',
    gradientEndColor: '#071b25',
    headerBackgroundColor: '#ffffff',
    headerButtonColor: '#6ac5bc',
    headerButtonTextColor: 'black',
    headingTextColor: 'white',
    bodyTextColor: 'gray',
    headerCtaText: 'Descubrir si es para mí',
    headerCtaUrl: '',
  },
  mainMessage: {
    valuePhrase: '',
    subtitle: '',
    ctaText: 'Quiero más información',
    ctaUrl: '',
  },
  problem: { ...emptyTextSection },
  promise: { ...emptyTextSection },
  leadMagnet: {
    title: 'Aclara tus dudas en una sesión gratuita de 30 minutos',
    description:
      'Cuéntame en qué punto estás, qué te está frenando o qué necesitas resolver. Tendremos 30 minutos para escucharte, aclarar tus dudas y ayudarte a identificar cuál puede ser tu próximo paso.',
    ctaText: 'Reservar mi encuentro gratuito',
    /** Legacy optional URL — ignored by the free-session booking flow. */
    resourceUrl: '',
  },
  story: { ...emptyTextSection },
  method: {
    title: '',
    steps: defaultMethodSteps.map((step) => ({ ...step })) as PresentationFormState['method']['steps'],
  },
  socialProof: {
    testimonialName: '',
    testimonialText: '',
    proofUrl: '',
  },
  videos: {
    youtubeShortUrl: '',
    tiktokUrl: '',
  },
  services: defaultServices.map((service) => ({ ...service })) as PresentationFormState['services'],
  contents: defaultContents.map((item) => ({ ...item })) as PresentationFormState['contents'],
  finalCta: {
    title: '',
    description: '',
    ctaText: 'Comenzar ahora',
    ctaUrl: '',
  },
  formConfig: {
    nameEnabled: true,
    whatsappEnabled: true,
    countryEnabled: true,
    cityEnabled: true,
    interestEnabled: true,
    messageEnabled: true,
    formTitle: '¿Te interesa dar el siguiente paso?',
    formDescription: 'Completa el formulario y te contactaremos pronto.',
    whatsappGroupUrl: '',
    floatingWhatsAppUrl: '',
    interestOptionsText: defaultInterestOptionsText,
  },
  socialLinks: {
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    website: '',
    whatsapp: '',
  },
  booking: {
    enabled: false,
    durationMinutes: 30,
    timezone: 'Europe/Madrid',
    title: 'Aclara tus dudas en una sesión gratuita de 30 minutos',
    description: 'Los encuentros son limitados y dependen de la disponibilidad de agenda.',
    googleMeet: false,
  },
}

/** Support / availability copy for the public free-session block. */
export const PRESENTATION_FREE_SESSION_AVAILABILITY_COPY =
  'Los encuentros son limitados y dependen de la disponibilidad de agenda.'

export const PRESENTATION_FREE_SESSION_CTA_DEFAULT = 'Reservar mi encuentro gratuito'

export const PRESENTATION_FREE_SESSION_TITLE_DEFAULT =
  'Aclara tus dudas en una sesión gratuita de 30 minutos'

export const PRESENTATION_FREE_SESSION_DESCRIPTION_DEFAULT =
  'Cuéntame en qué punto estás, qué te está frenando o qué necesitas resolver. Tendremos 30 minutos para escucharte, aclarar tus dudas y ayudarte a identificar cuál puede ser tu próximo paso.'

/** Exact historical Lead Magnet CTA defaults — never overwrite custom owner CTAs. */
export const LEGACY_LEAD_MAGNET_CTA_DEFAULTS = [
  'Descargar guía',
  'Descargar recurso',
  'Obtener guía',
  'Acceder al recurso',
  'Agendar mi encuentro',
] as const

/** Exact historical / fallback titles incompatible with Encuentro gratuito. */
export const LEGACY_LEAD_MAGNET_TITLE_DEFAULTS = [
  'Recurso gratuito',
  'Descarga mi guía',
  'Obtén este recurso',
  'Agenda un encuentro',
] as const

/** Exact historical descriptions incompatible with Encuentro gratuito. */
export const LEGACY_LEAD_MAGNET_DESCRIPTION_DEFAULTS = [
  'Descarga mi guía',
  'Obtén este recurso',
  'Guía, diagnóstico o clase gratuita.',
  'Guía, diagnóstico o clase gratuita',
] as const

function isExactLegacyDefault(value: string, defaults: readonly string[]): boolean {
  return defaults.includes(value)
}

/** Normalize CTA for display/editor load without mutating Firestore. */
export function resolveFreeSessionCtaText(value?: string | null): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || isExactLegacyDefault(trimmed, LEGACY_LEAD_MAGNET_CTA_DEFAULTS)) {
    return PRESENTATION_FREE_SESSION_CTA_DEFAULT
  }
  return trimmed
}

export function resolveFreeSessionTitle(value?: string | null): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || isExactLegacyDefault(trimmed, LEGACY_LEAD_MAGNET_TITLE_DEFAULTS)) {
    return PRESENTATION_FREE_SESSION_TITLE_DEFAULT
  }
  return trimmed
}

export function resolveFreeSessionDescription(value?: string | null): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || isExactLegacyDefault(trimmed, LEGACY_LEAD_MAGNET_DESCRIPTION_DEFAULTS)) {
    return PRESENTATION_FREE_SESSION_DESCRIPTION_DEFAULT
  }
  return trimmed
}

export function formatFreeSessionDurationLabel(durationMinutes: number): string {
  const minutes = Number(durationMinutes) > 0 ? Math.floor(Number(durationMinutes)) : 30
  return `${minutes} minutos · Sin compromiso`
}

/** Campos del formulario público — vista previa visual. */
export const presentationFormPreviewFields = [
  { label: 'Nombre', placeholder: 'Tu nombre completo', key: 'name' as const },
  { label: 'WhatsApp', placeholder: '+51 999 999 999', key: 'whatsapp' as const },
  { label: 'País', placeholder: 'Selecciona un país', key: 'country' as const },
  { label: 'Ciudad', placeholder: 'Selecciona una ciudad', key: 'city' as const },
  { label: 'Interés', placeholder: 'Selecciona una opción', key: 'interest' as const },
  { label: 'Mensaje', placeholder: 'Cuéntanos un poco sobre ti...', key: 'message' as const },
]

export function getPresentationFormPreviewField(
  key: (typeof presentationFormPreviewFields)[number]['key'],
) {
  const field = presentationFormPreviewFields.find((item) => item.key === key)
  if (!field) {
    throw new Error(`Campo de formulario no encontrado: ${key}`)
  }
  return field
}
