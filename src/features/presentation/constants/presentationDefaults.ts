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
  { title: 'Diagnóstico', description: '', ctaText: 'Solicitar diagnóstico' },
  { title: 'Mentoría', description: '', ctaText: 'Agendar mentoría' },
  { title: 'Conferencia', description: '', ctaText: 'Reservar conferencia' },
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
  },
  mainMessage: {
    valuePhrase: '',
    subtitle: '',
    ctaText: 'Quiero más información',
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
  },
  formConfig: {
    nameEnabled: true,
    whatsappEnabled: true,
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
}

/** Campos del formulario público — vista previa visual. */
export const presentationFormPreviewFields = [
  { label: 'Nombre', placeholder: 'Tu nombre completo', key: 'name' as const },
  { label: 'WhatsApp', placeholder: '+51 999 999 999', key: 'whatsapp' as const },
  { label: 'Interés', placeholder: 'Selecciona una opción', key: 'interest' as const },
  { label: 'Mensaje', placeholder: 'Cuéntanos un poco sobre ti...', key: 'message' as const },
]
