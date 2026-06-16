import type { LucideIcon } from 'lucide-react'

export type DashboardModule = {
  number: number
  title: string
  subtitle: string
  icon: LucideIcon
  to: string
  ownerOnly?: boolean
}

export type DashboardKpi = {
  label: string
  value: string
  detail: string
  trend?: 'up' | 'neutral'
  icon: LucideIcon
  showProgressRing?: boolean
  source?: 'live' | 'demo'
}

export type DashboardSuggestion = {
  title: string
  message: string
  actionLabel: string
  actionTo: string
}

export type DashboardProgress = {
  weeklyValue: number
  weeklyGoal: number
  weeklyMessage: string
  planProgressValue: number
}

export type DashboardMotivationalQuote = {
  text: string
}

export type DashboardNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  placeholder?: boolean
  ownerOnly?: boolean
  activationOnly?: boolean
}

export type DashboardQuickAction = {
  label: string
  icon: LucideIcon
}

export type DashboardUserIdentity = {
  displayName: string
  email: string
  firstName: string
  roleLabel: string
  initials: string
}
