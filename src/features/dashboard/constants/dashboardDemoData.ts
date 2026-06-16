import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutGrid,
  LayoutDashboard,
  Lightbulb,
  PlayCircle,
  Presentation,
  Radar,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'
import type {
  DashboardModule,
  DashboardMotivationalQuote,
  DashboardNavItem,
  DashboardProgress,
  DashboardQuickAction,
  DashboardSuggestion,
} from '@/features/dashboard/types/dashboard.types'

export const DASHBOARD_WELCOME_SUBTITLE =
  'Tu sistema de crecimiento está listo para ayudarte paso a paso.'

export const DASHBOARD_PANEL_TITLE = 'Panel principal'

export const dashboardQuickActions: DashboardQuickAction[] = [
  { label: 'Cómo funciona', icon: PlayCircle },
  { label: 'Invitar', icon: UserPlus },
  { label: 'Ayuda', icon: Lightbulb },
]

export const dashboardNavItems: DashboardNavItem[] = [
  { label: 'Panel principal', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Mi grupo', to: '/dashboard/mi-grupo', icon: UsersRound },
  { label: 'Presentación', to: '/dashboard/presentacion', icon: Presentation, ownerOnly: true },
  { label: 'Radar de Interés', to: '/dashboard/radar', icon: Radar, ownerOnly: true },
  { label: 'Contactos', to: '/dashboard/contactos', icon: Users, ownerOnly: true },
  { label: 'Academia', to: '/dashboard/academia', icon: BookOpen },
  { label: 'Progreso Academia', to: '/dashboard/progreso-academia', icon: BarChart3, activationOnly: true },
  { label: 'Plan de Acción', to: '/dashboard/plan', icon: ClipboardList },
  { label: 'Reconocimientos', to: '/dashboard/reconocimientos', icon: Award },
]

export const dashboardModules: DashboardModule[] = [
  {
    number: 1,
    title: 'Presentación',
    subtitle: 'Expande tu marca personal',
    icon: LayoutGrid,
    to: '/dashboard/presentacion',
    ownerOnly: true,
  },
  {
    number: 2,
    title: 'Radar de Interés',
    subtitle: 'Descubre oportunidades clave',
    icon: Radar,
    to: '/dashboard/radar',
    ownerOnly: true,
  },
  {
    number: 3,
    title: 'Contactos',
    subtitle: 'Gestiona y conecta con tu red',
    icon: Users,
    to: '/dashboard/contactos',
    ownerOnly: true,
  },
  {
    number: 4,
    title: 'Academia',
    subtitle: 'Aprende y crece sin límites',
    icon: BookOpen,
    to: '/dashboard/academia',
  },
  {
    number: 5,
    title: 'Plan de Acción',
    subtitle: 'Organiza y ejecuta tus pasos',
    icon: ClipboardList,
    to: '/dashboard/plan',
  },
  {
    number: 6,
    title: 'Reconocimientos',
    subtitle: 'Celebra tus logros y avances',
    icon: Award,
    to: '/dashboard/reconocimientos',
  },
]

/** Sugerencia del día — placeholder hasta integrar lógica real. */
export const dashboardSuggestion: DashboardSuggestion = {
  title: 'Sugerencia de hoy',
  message:
    'Dedica 15 minutos a agregar 3 nuevos contactos. Pequeñas acciones, grandes resultados.',
  actionLabel: 'Ir a Contactos',
  actionTo: '/dashboard/contactos',
}

/** Avance semanal — placeholder hasta integrar métricas reales. */
export const dashboardProgress: DashboardProgress = {
  weeklyValue: 72,
  weeklyGoal: 90,
  weeklyMessage: '¡Muy buen progreso!',
  planProgressValue: 68,
}

/** Frase motivacional — placeholder rotativo futuro. */
export const dashboardMotivationalQuote: DashboardMotivationalQuote = {
  text: 'El crecimiento no es casualidad, es decisión diaria.',
}
