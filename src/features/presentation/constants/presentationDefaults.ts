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
    title: '',
    description: '',
    ctaText: 'Descargar guía',
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
    title: 'Conversemos 30 minutos sobre tu próximo paso',
    description: '',
    googleMeet: false,
  },
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
