import type { Timestamp } from 'firebase/firestore'

export type AppRoute = '/'

export type UserRole = 'admin' | 'user' | 'leader' | 'member' | 'prospect'

export type UserStatus = 'active' | 'inactive' | 'pending_verification'

export type UserActivationStatus = 'none' | 'active' | 'pending' | 'rejected' | 'expired'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'registered'
  | 'active'
  | 'lost'

export type LeadActivityType =
  | 'note'
  | 'call'
  | 'whatsapp'
  | 'status_change'
  | 'task'

export type FirestoreDate = Timestamp

export interface AppUser {
  uid: string
  email: string
  displayName: string
  phone: string
  photoURL?: string
  role: UserRole
  leaderId?: string
  homeTeamId?: string
  ownedTeamId?: string
  activationStatus?: UserActivationStatus
  activationExpiresAt?: FirestoreDate
  referralCode?: string
  status: UserStatus
  emailVerified: boolean
  createdAt: FirestoreDate
  updatedAt: FirestoreDate
}

export interface LeaderStats {
  totalProspects: number
  totalContacted: number
  totalRegistered: number
  totalActive: number
}

export interface Leader {
  uid: string
  displayName: string
  slug: string
  referralCode: string
  whatsapp: string
  bio: string
  avatarUrl: string
  landingEnabled: boolean
  stats: LeaderStats
  createdAt: FirestoreDate
  updatedAt: FirestoreDate
}

export interface LeaderLandingPage {
  leaderId: string
  heroTitle: string
  heroSubtitle: string
  description: string
  videoUrl: string
  whatsappMessage: string
  ctaText: string
  isPublished: boolean
  createdAt: FirestoreDate
  updatedAt: FirestoreDate
}

export interface Prospect {
  id?: string
  leaderId: string
  source: string
  fullName: string
  phone: string
  email?: string
  city?: string
  status: LeadStatus
  notes: string
  createdAt: FirestoreDate
  updatedAt: FirestoreDate
}

export interface LeadActivity {
  id?: string
  prospectId: string
  leaderId: string
  type: LeadActivityType
  description: string
  createdAt: FirestoreDate
  createdBy: string
}

export interface ReferralCode {
  code: string
  leaderId: string
  uid: string
  isActive: boolean
  createdAt: FirestoreDate
}

export interface SlugReservation {
  slug: string
  uid: string
  isActive: boolean
  createdAt: FirestoreDate
}

export type CreateAppUserInput = Omit<AppUser, 'createdAt' | 'updatedAt'>
export type UpdateAppUserInput = Partial<Omit<AppUser, 'uid' | 'createdAt' | 'updatedAt'>>

export type CreateLeaderInput = Omit<Leader, 'createdAt' | 'updatedAt'>
export type UpdateLeaderInput = Partial<Omit<Leader, 'uid' | 'createdAt' | 'updatedAt'>>

export type CreateLeaderLandingPageInput = Omit<
  LeaderLandingPage,
  'createdAt' | 'updatedAt'
>
export type UpdateLeaderLandingPageInput = Partial<
  Omit<LeaderLandingPage, 'leaderId' | 'createdAt' | 'updatedAt'>
>

export type CreateProspectInput = Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProspectInput = Partial<
  Omit<Prospect, 'id' | 'leaderId' | 'createdAt' | 'updatedAt'>
>

export type CreateLeadActivityInput = Omit<LeadActivity, 'id' | 'createdAt'>
export type CreateReferralCodeInput = Omit<ReferralCode, 'createdAt'>
export type CreateSlugReservationInput = Omit<SlugReservation, 'createdAt'>
