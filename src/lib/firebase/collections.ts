export const COLLECTIONS = {
  users: 'users',
  leaders: 'leaders',
  leaderLandingPages: 'leaderLandingPages',
  prospects: 'prospects',
  leadActivities: 'leadActivities',
  referralCodes: 'referralCodes',
  slugs: 'slugs',
  academyMaterials: 'academyMaterials',
  academyTests: 'academyTests',
  academyTestAttempts: 'academyTestAttempts',
  academyMaterialEngagements: 'academyMaterialEngagements',
  actionTasks: 'actionTasks',
  teams: 'teams',
  leaderInviteCodes: 'leaderInviteCodes',
  teamMembers: 'teamMembers',
  groupActivationRequests: 'groupActivationRequests',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]
