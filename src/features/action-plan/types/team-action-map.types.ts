import type { Timestamp } from 'firebase/firestore'

export type TeamMapPeriodType = '30_days' | '60_days' | '90_days' | '6_months' | '1_year'

export type TeamMapStatus = 'green' | 'yellow' | 'red'

/** Área del mapa. `linkedTaskIds` reservado para conectar tareas en una fase posterior. */
export type TeamMapArea = {
  id: string
  title: string
  description?: string
  objective?: string
  indicator?: string
  status?: TeamMapStatus
  order: number
  linkedTaskIds?: string[]
}

export type TeamActionMap = {
  id: string
  teamId: string
  ownerUid: string
  title: string
  description?: string
  vision: string
  mainObjective: string
  periodType: TeamMapPeriodType
  periodLabel: string
  startDate: string | null
  endDate: string | null
  status: TeamMapStatus
  isActive: boolean
  areas: TeamMapArea[]
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type TeamActionMapAreaInput = {
  id?: string
  title: string
  description?: string
  objective?: string
  indicator?: string
  status?: TeamMapStatus
  order: number
  linkedTaskIds?: string[]
}

export type UpsertTeamActionMapInput = {
  title: string
  description?: string
  vision: string
  mainObjective: string
  periodType: TeamMapPeriodType
  startDate: string | null
  endDate: string | null
  status: TeamMapStatus
  areas: TeamActionMapAreaInput[]
}
