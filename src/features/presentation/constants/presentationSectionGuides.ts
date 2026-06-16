export type PresentationEditorSectionMeta = {
  emoji: string
  badge: string
  guide: string
}

export const PRESENTATION_EDITOR_SECTIONS = {
  status: {
    emoji: '🚀',
    badge: 'Publicación',
    guide:
      'Define tu enlace público, revisa el estado y publica cuando tu landing esté lista para compartir.',
  },
  visualIdentity: {
    emoji: '🎨',
    badge: 'Identidad visual',
    guide:
      'Logo, foto, nombre de marca y colores. Lo que configures aquí se verá en el header, hero y footer de tu landing.',
  },
  mainMessage: {
    emoji: '💬',
    badge: 'Hero',
    guide:
      'Es lo primero que verán tus visitantes: tu propuesta de valor, subtítulo y botón principal.',
  },
  problem: {
    emoji: '🎯',
    badge: 'Problema',
    guide: 'Describe el dolor o situación que vive tu audiencia antes de conocerte.',
  },
  promise: {
    emoji: '✨',
    badge: 'Promesa',
    guide: 'Explica el resultado o transformación que la persona puede lograr contigo.',
  },
  leadMagnet: {
    emoji: '🎁',
    badge: 'Lead magnet',
    guide: 'Ofrece un recurso gratuito (guía, clase, diagnóstico) para captar interés.',
  },
  story: {
    emoji: '📖',
    badge: 'Historia',
    guide: 'Humaniza tu marca: quién eres, por qué haces esto y qué te hace creíble.',
  },
  method: {
    emoji: '🧭',
    badge: 'Método',
    guide: 'Presenta tu sistema en 3 pasos claros para que entiendan cómo trabajas.',
  },
  socialProof: {
    emoji: '⭐',
    badge: 'Prueba social',
    guide: 'Testimonios, casos o evidencia que refuercen confianza en tu propuesta.',
  },
  videos: {
    emoji: '🎬',
    badge: 'Videos',
    guide: 'Pega enlaces de YouTube Shorts o TikTok. Se mostrarán embebidos en tu landing.',
  },
  services: {
    emoji: '🛠️',
    badge: 'Servicios',
    guide: 'Hasta 3 servicios principales con título, descripción y botón de acción.',
  },
  contents: {
    emoji: '📚',
    badge: 'Autoridad',
    guide: 'Videos, artículos o entrevistas que demuestren tu experiencia y credibilidad.',
  },
  finalCta: {
    emoji: '🔥',
    badge: 'CTA final',
    guide: 'Cierra con una llamada a la acción clara antes del formulario de contacto.',
  },
  socialLinks: {
    emoji: '🔗',
    badge: 'Redes sociales',
    guide: 'Enlaces opcionales que aparecerán como iconos en el pie de tu landing.',
  },
  form: {
    emoji: '📝',
    badge: 'Formulario',
    guide: 'Configura el formulario visual de contacto. Por ahora es vista previa sin envío real.',
  },
} as const satisfies Record<string, PresentationEditorSectionMeta>

/** Secciones visibles en la landing pública / vista previa (misma estructura que el editor). */
export type PresentationLandingSectionKey = Exclude<
  keyof typeof PRESENTATION_EDITOR_SECTIONS,
  'status' | 'visualIdentity' | 'socialLinks'
>

export const PRESENTATION_LANDING_SECTION_ORDER: PresentationLandingSectionKey[] = [
  'mainMessage',
  'problem',
  'promise',
  'leadMagnet',
  'story',
  'method',
  'socialProof',
  'videos',
  'services',
  'contents',
  'finalCta',
  'form',
]
