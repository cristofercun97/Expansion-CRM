import type {
  InvitationOnboardingStepContent,
  InvitationOnboardingType,
} from '@/features/auth/types/invitationOnboarding.types'

type BuildContentInput = {
  type: InvitationOnboardingType
  teamName?: string
}

function buildGroupStep1Title(teamName?: string): string {
  const normalizedName = teamName?.trim()

  if (normalizedName) {
    return `👋 Te han invitado a formar parte de ${normalizedName}`
  }

  return '👋 Te han invitado a formar parte de un grupo en Expansión'
}

export function buildInvitationOnboardingSteps(
  input: BuildContentInput,
): Record<1 | 2 | 3, InvitationOnboardingStepContent> {
  if (input.type === 'group') {
    return {
      1: {
        title: buildGroupStep1Title(input.teamName),
        paragraphs: [
          'Expansión es un espacio donde podrás aprender, organizarte y avanzar junto a otras personas.',
          'No necesitas tener experiencia. Te acompañaremos paso a paso.',
        ],
        primaryLabel: 'Siguiente →',
      },
      2: {
        title: '🚀 ¿Qué encontrarás dentro?',
        benefits: [
          {
            emoji: '📚',
            title: 'Aprender',
            description: 'Accede a formación sencilla para mejorar tus conocimientos.',
          },
          {
            emoji: '🎯',
            title: 'Tener un plan',
            description: 'Sabrás qué hacer y cuáles son tus próximos pasos.',
          },
          {
            emoji: '👥',
            title: 'Crecer acompañado',
            description: 'Forma parte de un equipo y avanza junto a otras personas.',
          },
          {
            emoji: '📈',
            title: 'Ver tu progreso',
            description: 'Organiza tus actividades y observa cómo vas avanzando.',
          },
        ],
        primaryLabel: 'Siguiente →',
        showBack: true,
      },
      3: {
        title: '🌱 Tú das el primer paso. Expansión te ayuda con el camino.',
        paragraphs: [
          'Piensa en Expansión como una guía.',
          'Te ayuda a saber:',
        ],
        benefits: [
          { emoji: '📚', title: 'Qué aprender.' },
          { emoji: '🎯', title: 'Qué hacer.' },
          { emoji: '👥', title: 'Con quién hablar.' },
          { emoji: '➡️', title: 'Y cuál es tu siguiente paso.' },
        ],
        closingParagraphs: ['Todo organizado en un mismo lugar.'],
        primaryLabel: 'Unirme al grupo',
        showBack: true,
        showSkip: true,
      },
    }
  }

  return {
    1: {
      title: '👋 Alguien quiere compartir Expansión contigo',
      paragraphs: [
        'Expansión es una plataforma creada para ayudarte a organizar tus contactos, aprender y hacer crecer tu actividad de una manera sencilla.',
        'Todo desde un mismo lugar.',
      ],
      primaryLabel: 'Quiero saber más →',
    },
    2: {
      title: '🧭 Imagínalo como tu guía de crecimiento',
      benefits: [
        { emoji: '👥', title: 'Con quién hablar' },
        { emoji: '📅', title: 'A quién dar seguimiento' },
        { emoji: '📚', title: 'Qué aprender' },
        { emoji: '🎯', title: 'Qué hacer cada día' },
        { emoji: '📈', title: 'Cómo estás avanzando' },
      ],
      closingParagraphs: ['Para que no tengas que llevarlo todo en tu cabeza.'],
      primaryLabel: 'Siguiente →',
      showBack: true,
    },
    3: {
      title: '🚀 Tú haces las conexiones. Expansión te ayuda a organizarlas.',
      paragraphs: [
        'No necesitas saber de tecnología.',
        'Empieza poco a poco.',
        'Añade tus contactos.',
        'Sigue tu plan.',
        'Aprende.',
        'Conecta con personas.',
        'Y avanza a tu ritmo.',
      ],
      primaryLabel: 'Crear mi cuenta',
      showBack: true,
      showSkip: true,
    },
  }
}
