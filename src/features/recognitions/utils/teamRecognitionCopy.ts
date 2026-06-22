import {
  BookOpen,
  HandHeart,
  Heart,
  Rocket,
  Shield,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type {
  TeamRecognitionType,
  TeamRecognitionVisibility,
} from '@/features/recognitions/types/team-recognition.types'
import type { Timestamp } from 'firebase/firestore'

export type TeamRecognitionTypeOption = {
  type: TeamRecognitionType
  label: string
  title: string
  message: string
  icon: LucideIcon
  accent: string
}

export const TEAM_RECOGNITION_TYPE_OPTIONS: TeamRecognitionTypeOption[] = [
  {
    type: 'commitment',
    label: 'Compromiso',
    title: 'Compromiso destacado',
    message:
      'Reconocemos tu compromiso por mantenerte presente y avanzar con responsabilidad dentro del equipo.',
    icon: HandHeart,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  },
  {
    type: 'consistency',
    label: 'Constancia',
    title: 'Constancia que inspira',
    message:
      'Tu avance constante demuestra disciplina y ayuda a mantener el ritmo del grupo.',
    icon: Shield,
    accent: 'border-gold/25 bg-gold/10 text-gold-light',
  },
  {
    type: 'attitude',
    label: 'Actitud',
    title: 'Actitud positiva',
    message:
      'Reconocemos tu actitud, energía y disposición para seguir creciendo junto al equipo.',
    icon: Sparkles,
    accent: 'border-teal-accent/20 bg-white/8 text-teal-accent',
  },
  {
    type: 'training',
    label: 'Formación',
    title: 'Formación en movimiento',
    message:
      'Tu dedicación al aprendizaje fortalece tu crecimiento y aporta valor al grupo.',
    icon: BookOpen,
    accent: 'border-gold/20 bg-white/8 text-gold-light',
  },
  {
    type: 'leadership',
    label: 'Liderazgo',
    title: 'Liderazgo en acción',
    message:
      'Reconocemos tu iniciativa, apoyo y capacidad para inspirar a otros miembros.',
    icon: Target,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  },
  {
    type: 'progress',
    label: 'Progreso',
    title: 'Gran avance',
    message:
      'Reconocemos tu progreso y el esfuerzo que estás haciendo para seguir dando pasos importantes.',
    icon: Rocket,
    accent: 'border-gold/25 bg-gold/10 text-gold-light',
  },
  {
    type: 'team_spirit',
    label: 'Espíritu de equipo',
    title: 'Espíritu de equipo',
    message:
      'Gracias por aportar unión, colaboración y energía positiva al grupo.',
    icon: Heart,
    accent: 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
  },
]

export const SEND_TEAM_RECOGNITION_MODAL = {
  title: 'Reconocer miembro',
  subtitle: 'Celebra el esfuerzo de alguien que está aportando al crecimiento del equipo.',
  microcopy:
    'No todo reconocimiento nace del ranking. A veces el mayor avance está en la actitud, la constancia o el primer paso.',
  submitLabel: 'Enviar reconocimiento',
  successToast: 'Reconocimiento enviado.',
  errorMessage: 'No pudimos enviar el reconocimiento. Inténtalo de nuevo.',
}

export const TEAM_RECOGNITIONS_SECTION = {
  leaderTitle: 'Reconocimientos del líder',
  recentTitle: 'Reconocimientos recientes',
  leaderButton: 'Reconocer miembro',
  leaderEmpty:
    'Aún no has enviado reconocimientos. Celebra una actitud, un avance o un compromiso destacado.',
  memberEmpty:
    'Aún no hay reconocimientos publicados. Sigue avanzando para aparecer aquí.',
}

export const TEAM_RECOGNITION_VISIBILITY_OPTIONS: {
  value: TeamRecognitionVisibility
  label: string
  description: string
}[] = [
  {
    value: 'team',
    label: 'Público para el equipo',
    description: 'Visible para todos los miembros del grupo.',
  },
  {
    value: 'private',
    label: 'Privado para el miembro',
    description: 'Solo tú y la persona reconocida podrán verlo.',
  },
]

export function getTeamRecognitionTypeOption(
  type: TeamRecognitionType,
): TeamRecognitionTypeOption {
  return (
    TEAM_RECOGNITION_TYPE_OPTIONS.find((option) => option.type === type) ??
    TEAM_RECOGNITION_TYPE_OPTIONS[0]
  )
}

export function getTeamRecognitionTypeLabel(type: TeamRecognitionType): string {
  return getTeamRecognitionTypeOption(type).label
}

export function formatTeamRecognitionDate(timestamp: Timestamp | null): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
