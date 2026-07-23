export type PresentationEditorStepId =
  | 'status'
  | 'visualIdentity'
  | 'mainMessage'
  | 'problemPromise'
  | 'leadStory'
  | 'method'
  | 'socialVideos'
  | 'servicesContents'
  | 'ctaSocial'
  | 'form'

export type PresentationEditorStep = {
  id: PresentationEditorStepId
  label: string
  shortLabel: string
  emoji: string
  description: string
}

export const PRESENTATION_EDITOR_STEPS: PresentationEditorStep[] = [
  {
    id: 'status',
    label: 'Publicación',
    shortLabel: 'Publicar',
    emoji: '🚀',
    description: 'Define tu enlace público y el estado de tu presentación.',
  },
  {
    id: 'visualIdentity',
    label: 'Identidad visual',
    shortLabel: 'Identidad',
    emoji: '🎨',
    description: 'Logo, foto, marca y colores de tu landing.',
  },
  {
    id: 'mainMessage',
    label: 'Mensaje principal',
    shortLabel: 'Hero',
    emoji: '💬',
    description: 'Tu propuesta de valor, subtítulo y botón principal.',
  },
  {
    id: 'problemPromise',
    label: 'Problema y promesa',
    shortLabel: 'Problema',
    emoji: '🎯',
    description: 'El dolor de tu audiencia y la transformación que ofreces.',
  },
  {
    id: 'leadStory',
    label: 'Lead e historia',
    shortLabel: 'Historia',
    emoji: '📖',
    description: 'Recurso gratuito y tu historia personal.',
  },
  {
    id: 'method',
    label: 'Método',
    shortLabel: 'Método',
    emoji: '🧭',
    description: 'Tu sistema en 3 pasos claros.',
  },
  {
    id: 'socialVideos',
    label: 'Confianza',
    shortLabel: 'Confianza',
    emoji: '⭐',
    description: 'Prueba social y videos para generar confianza.',
  },
  {
    id: 'servicesContents',
    label: 'Oferta',
    shortLabel: 'Oferta',
    emoji: '🛠️',
    description: 'Servicios y contenido de autoridad.',
  },
  {
    id: 'ctaSocial',
    label: 'Cierre',
    shortLabel: 'Cierre',
    emoji: '🔥',
    description: 'CTA final y redes sociales.',
  },
  {
    id: 'form',
    label: 'Formulario',
    shortLabel: 'Formulario',
    emoji: '📝',
    description: 'Configura el formulario de contacto.',
  },
]

export const PRESENTATION_EDITOR_STEP_COUNT = PRESENTATION_EDITOR_STEPS.length
