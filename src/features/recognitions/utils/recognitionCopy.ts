import {
  BookOpen,
  HandHeart,
  Rocket,
  Shield,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

export const RECOGNITIONS_PAGE_TITLE = 'Reconocimientos'

export const RECOGNITIONS_PAGE_SUBTITLE =
  'Celebra el avance, la constancia y el compromiso de tu equipo.'

export const RECOGNITIONS_EMPTY_TITLE =
  'Todavía no tienes un grupo activo para participar en reconocimientos.'

export const RECOGNITIONS_EMPTY_DESCRIPTION =
  'Únete a un grupo o activa tu propio grupo para participar en reconocimientos.'

export const RECOGNITIONS_HERO = {
  title: 'Tu equipo también crece cuando se reconoce el esfuerzo.',
  description:
    'Aquí verás los miembros destacados, logros recientes y reconocimientos del grupo.',
  cta: 'Muy pronto podrás ver el podio semanal y el MVP del mes.',
}

export const WEEKLY_PODIUM_COPY = {
  title: 'Podio semanal',
  subtitle: 'El top 3 semanal marca el ritmo del equipo.',
  salesValidatedHint:
    'El impacto comercial solo cuenta cuando el líder valida la venta.',
  firstPlaceSalesHint:
    'También destacó por impacto comercial esta semana.',
  salesImpactNote:
    'Las ventas validadas reflejan avance comercial real.',
  monthlyPrizesHint: 'Los premios mensuales refuerzan el compromiso y la constancia.',
  placeholder:
    'El podio semanal se activará cuando el equipo empiece a registrar avances.',
  positions: [
    { rank: 1, label: 'Primer lugar', emoji: '🥇' },
    { rank: 2, label: 'Segundo lugar', emoji: '🥈' },
    { rank: 3, label: 'Tercer lugar', emoji: '🥉' },
  ],
}

export const MONTHLY_PODIUM_PRIZES_COPY = {
  title: 'Premios mensuales del podio',
  compactTitle: 'Premios del mes',
  description:
    'El top 3 semanal compite durante el mes por estos premios. Se entregan al cierre mensual.',
  unconfigured: 'Premios mensuales por configurar',
  emptySlot: 'Por definir',
  firstLabel: 'MVP Del Mes',
  secondLabel: 'Segundo Lugar',
  thirdLabel: 'Tercer Lugar',
  configureButton: 'Configurar premios',
  addButton: 'Agregar premio',
  modalEyebrow: 'Reconocimientos',
  modalTitle: 'Premios mensuales del podio',
  modalDescription:
    'Define qué recibirá el top 3 al cierre del mes. Visible para todo el equipo.',
  firstInputLabel: 'MVP Del Mes (1er lugar)',
  secondInputLabel: 'Segundo Lugar (2do lugar)',
  thirdInputLabel: 'Tercer Lugar (3er lugar)',
  firstInputPlaceholder: 'Ej. Cena especial o bono simbólico',
  secondInputPlaceholder: 'Ej. Detalle premium del equipo',
  thirdInputPlaceholder: 'Ej. Reconocimiento simbólico',
  saveLabel: 'Guardar premios',
  saveSuccess: 'Premios mensuales guardados.',
}

export const DASHBOARD_WEEKLY_PODIUM_COPY = {
  title: 'Top 3 semanal',
  emptyTitle: 'El podio semanal está abierto.',
  leaderEmptyHint: 'Publica el ranking semanal para que tu equipo vea el podio.',
  memberEmptyHint: 'Completa acciones para empezar a competir.',
  publishedHint: 'Cada semana cuenta para los premios mensuales del top 3.',
  commercialImpactActive: 'Impacto comercial activo esta semana.',
}

export const MONTHLY_MVP_COPY = {
  title: 'MVP del mes',
  emoji: '🏆',
  description:
    'El MVP del mes recibe el premio principal simbólico del equipo por constancia, avance y compromiso acumulados.',
  placeholder: 'Aún estamos reuniendo actividad para elegir al próximo MVP.',
}

export type RecognitionCategory = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  accent: string
}

export const RECOGNITION_CATEGORIES: RecognitionCategory[] = [
  {
    id: 'commitment',
    title: 'Compromiso',
    description: 'Reconoce a quienes se mantienen presentes y activos.',
    icon: HandHeart,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  },
  {
    id: 'consistency',
    title: 'Constancia',
    description: 'Celebra a quienes avanzan semana a semana.',
    icon: Shield,
    accent: 'border-gold/25 bg-gold/10 text-gold-light',
  },
  {
    id: 'training',
    title: 'Formación',
    description: 'Destaca el aprendizaje y la preparación.',
    icon: BookOpen,
    accent: 'border-teal-accent/20 bg-white/8 text-teal-accent',
  },
  {
    id: 'action',
    title: 'Acción',
    description: 'Reconoce tareas completadas y avance operativo.',
    icon: Target,
    accent: 'border-gold/20 bg-white/8 text-gold-light',
  },
  {
    id: 'leadership',
    title: 'Liderazgo',
    description: 'Premia actitud, iniciativa y apoyo al grupo.',
    icon: Sparkles,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  },
  {
    id: 'momentum',
    title: 'Mayor impulso',
    description: 'Reconoce a quien más mejoró respecto a su punto de partida.',
    icon: Rocket,
    accent: 'border-gold/25 bg-gold/10 text-gold-light',
  },
]

export const RECENT_ACHIEVEMENTS_COPY = {
  title: 'Logros recientes',
  description: 'Aquí aparecerán los avances importantes del equipo.',
  examplesLabel: 'Ejemplos de logros que podrás ver aquí',
  examples: [
    'Un miembro completó su primera acción.',
    'El equipo avanzó en formación.',
    'Se registró una nueva semana de progreso.',
  ],
}

export const LEADER_INSIGHT = {
  title: 'Vista de líder',
  message:
    'Como líder, pronto podrás reconocer miembros y ver el ranking de tu equipo.',
}

export const MEMBER_INSIGHT = {
  title: 'Tu camino al podio',
  message: 'Tus avances podrán ayudarte a aparecer en el podio y recibir reconocimientos.',
}

export const RECOGNITIONS_PAGE_HEADER_CLASS =
  'border-white/10 [&_h1]:text-hero-text [&_p]:text-hero-text/70'
