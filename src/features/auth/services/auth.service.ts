import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { ensureUniqueReferralCode, ensureUniqueSlug } from '@/features/auth/utils/uniqueness'
import { recommendationCodeService } from '@/features/referrals/services/recommendation-code.service'
import { referralUplineService } from '@/features/referrals/services/referral-upline.service'
import { teamService } from '@/features/team/services/team.service'
import type { InviteValidationResult, LeaderInviteCode } from '@/features/team/types/team.types'
import { COLLECTIONS, getFirebaseDb, getFirebaseAuth } from '@/lib/firebase'
import { usersService } from '@/services/users.service'
import type { GoogleRegisterInput, RegisterInput } from '@/features/auth/types'
import { normalizeRecommendationCodeParam } from '@/features/referrals/utils/recommendationUtils'
import { mapFirebaseAuthError } from '@/features/settings/utils/userSettings.utils'

type RecommendationAttribution = {
  recommenderUserId: string
  code: string
}

function resolveRecommendationCodeFromInput(
  input: RegisterInput | GoogleRegisterInput,
): string | undefined {
  return (
    normalizeRecommendationCodeParam(input.recommendationCodeFromUrl) ??
    normalizeRecommendationCodeParam(input.referralCodeFromUrl)
  )
}

async function resolveRecommendationAttribution(
  input: RegisterInput | GoogleRegisterInput,
): Promise<RecommendationAttribution | null> {
  const code = resolveRecommendationCodeFromInput(input)

  if (!code) {
    return null
  }

  const validation = await recommendationCodeService.validateRecommendationCode(code)

  if (!validation.valid || !validation.recommenderUserId) {
    return null
  }

  return {
    recommenderUserId: validation.recommenderUserId,
    code: validation.code ?? code,
  }
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const DEFAULT_LANDING_PAGE = {
  heroTitle: 'Construye tu crecimiento paso a paso',
  heroSubtitle: 'Conoce un sistema diseñado para captar, formar y duplicar.',
  description: 'Déjame tus datos y te comparto cómo funciona Expansión.',
  videoUrl: '',
  whatsappMessage: 'Hola, quiero recibir más información sobre Expansión.',
  ctaText: 'Quiero información',
  isPublished: true,
} as const

async function ensureFreshAuthToken(user: User): Promise<void> {
  if (!user.emailVerified) {
    return
  }

  await user.getIdToken(true)
}

async function createRegistrationDocuments(
  user: User,
  input: RegisterInput,
  referralCode: string,
  slug: string,
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const timestamp = serverTimestamp()
  const displayName = input.displayName.trim()
  const email = input.email.trim()
  const photoURL = user.photoURL ?? ''

  // SECURITY: payloads alineados con firestore.rules (users, leaders, landing, referralCodes, slugs).
  batch.set(doc(db, COLLECTIONS.users, user.uid), {
    uid: user.uid,
    email,
    displayName,
    phone: '',
    photoURL,
    role: 'user',
    leaderId: user.uid,
    referralCode,
    recommendationCode: referralCode,
    status: 'pending_verification',
    emailVerified: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.leaders, user.uid), {
    uid: user.uid,
    displayName,
    slug,
    referralCode,
    whatsapp: '',
    bio: '',
    avatarUrl: photoURL,
    landingEnabled: true,
    stats: {
      totalProspects: 0,
      totalContacted: 0,
      totalRegistered: 0,
      totalActive: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.leaderLandingPages, user.uid), {
    leaderId: user.uid,
    ...DEFAULT_LANDING_PAGE,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.referralCodes, referralCode), {
    code: referralCode,
    leaderId: user.uid,
    uid: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.recommendationCodes, referralCode), {
    code: referralCode,
    recommenderUserId: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.slugs, slug), {
    slug,
    uid: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  await batch.commit()
}

async function createRecommendedUserRegistrationDocuments(
  user: User,
  input: RegisterInput,
  attribution: RecommendationAttribution,
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const timestamp = serverTimestamp()
  const displayName = input.displayName.trim()
  const email = input.email.trim()
  const photoURL = user.photoURL ?? ''
  const referralCode = await ensureUniqueReferralCode()
  const slug = await ensureUniqueSlug(displayName)
  const referralUpline = await referralUplineService.resolveReferralUplineForRecommendedRegistration(
    attribution.recommenderUserId,
    user.uid,
  )

  batch.set(doc(db, COLLECTIONS.users, user.uid), {
    uid: user.uid,
    email,
    displayName,
    phone: '',
    photoURL,
    role: 'user',
    leaderId: user.uid,
    referralCode,
    recommendationCode: referralCode,
    referredByUserId: attribution.recommenderUserId,
    referredByCode: attribution.code,
    sponsorSource: 'recommendation',
    status: 'pending_verification',
    emailVerified: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(referralUpline.length > 0
      ? {
          referralUpline,
          referralUplineSource: 'recommendation',
          referralUplineUpdatedAt: timestamp,
        }
      : {}),
  })

  batch.set(doc(db, COLLECTIONS.leaders, user.uid), {
    uid: user.uid,
    displayName,
    slug,
    referralCode,
    whatsapp: '',
    bio: '',
    avatarUrl: photoURL,
    landingEnabled: true,
    stats: {
      totalProspects: 0,
      totalContacted: 0,
      totalRegistered: 0,
      totalActive: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.leaderLandingPages, user.uid), {
    leaderId: user.uid,
    ...DEFAULT_LANDING_PAGE,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.referralCodes, referralCode), {
    code: referralCode,
    leaderId: user.uid,
    uid: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.recommendationCodes, referralCode), {
    code: referralCode,
    recommenderUserId: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.slugs, slug), {
    slug,
    uid: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  await batch.commit()
}

async function createInvitedMemberRegistrationDocuments(
  user: User,
  input: RegisterInput,
  invite: LeaderInviteCode,
  recommendationAttribution?: RecommendationAttribution | null,
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const timestamp = serverTimestamp()
  const displayName = input.displayName.trim()
  const email = input.email.trim()
  const photoURL = user.photoURL ?? ''
  const memberId = `${invite.teamId}_${user.uid}`
  const memberName = displayName || email.split('@')[0] || 'Usuario'
  const refreshedInvite = await teamService.getInviteCodeByCode(invite.code)
  const referralUpline = await referralUplineService.resolveReferralUplineForInvitedRegistration(
    invite.ownerUid,
    user.uid,
    refreshedInvite?.ownerReferralUpline,
  )
  const memberRecommendationCode = await recommendationCodeService.ensureUniqueRecommendationCode()

  const userDocument: Record<string, unknown> = {
    uid: user.uid,
    email,
    displayName,
    phone: '',
    photoURL,
    role: 'member',
    leaderId: invite.ownerUid,
    homeTeamId: invite.teamId,
    activationStatus: 'none',
    recommendationCode: memberRecommendationCode,
    status: 'pending_verification',
    emailVerified: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  if (referralUpline.length > 0) {
    userDocument.referralUpline = referralUpline
    userDocument.referralUplineSource = 'invite'
    userDocument.referralUplineUpdatedAt = timestamp
  }

  // invite define pertenencia de grupo; ref define sponsor comercial solo como metadata.
  // referralUpline en invitados sigue al dueño del grupo (reglas Firestore).
  if (
    recommendationAttribution &&
    recommendationAttribution.recommenderUserId !== invite.ownerUid
  ) {
    userDocument.referredByUserId = recommendationAttribution.recommenderUserId
    userDocument.referredByCode = recommendationAttribution.code
    userDocument.sponsorSource = 'recommendation'
  }

  batch.set(doc(db, COLLECTIONS.users, user.uid), userDocument)

  batch.set(doc(db, COLLECTIONS.recommendationCodes, memberRecommendationCode), {
    code: memberRecommendationCode,
    recommenderUserId: user.uid,
    isActive: true,
    createdAt: timestamp,
  })

  batch.set(doc(db, COLLECTIONS.teamMembers, memberId), {
    teamId: invite.teamId,
    ownerUid: invite.ownerUid,
    memberUid: user.uid,
    memberName,
    memberEmail: email,
    role: 'member',
    status: 'active',
    joinedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await batch.commit()
}

async function registerWithEmail(input: RegisterInput): Promise<User> {
  let inviteValidation: InviteValidationResult | null = null
  let recommendationAttribution: RecommendationAttribution | null = null

  if (input.inviteCode?.trim()) {
    inviteValidation = await teamService.validateInviteCode(input.inviteCode)

    if (!inviteValidation.valid) {
      throw new Error(inviteValidation.message)
    }
  }

  if (resolveRecommendationCodeFromInput(input)) {
    recommendationAttribution = await resolveRecommendationAttribution(input)

    if (!recommendationAttribution && !inviteValidation?.valid) {
      throw new Error('El código de recomendación no es válido o ya no está activo.')
    }
  }

  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    input.email.trim(),
    input.password,
  )

  const { user } = credential

  await updateProfile(user, {
    displayName: input.displayName.trim(),
  })

  await sendEmailVerification(user)

  if (inviteValidation?.valid) {
    await createInvitedMemberRegistrationDocuments(
      user,
      input,
      inviteValidation.invite,
      recommendationAttribution,
    )
  } else if (recommendationAttribution) {
    await createRecommendedUserRegistrationDocuments(user, input, recommendationAttribution)
  } else {
    const referralCode = await ensureUniqueReferralCode()
    const slug = await ensureUniqueSlug(input.displayName)
    await createRegistrationDocuments(user, input, referralCode, slug)
  }

  return user
}

async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  )

  const { user } = credential

  await syncEmailVerificationStatus(user)

  return getFirebaseAuth().currentUser ?? user
}

async function logoutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
}

async function sendPasswordResetEmailToUser(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
}

async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(getFirebaseAuth(), googleProvider)
  return credential.user
}

async function loginWithGoogle(): Promise<User> {
  const user = await signInWithGoogle()
  const profile = await usersService.getUserById(user.uid)

  if (!profile) {
    await signOut(getFirebaseAuth())
    throw new Error('No tienes una cuenta registrada. Crea una cuenta para continuar.')
  }

  await syncEmailVerificationStatus(user)

  return getFirebaseAuth().currentUser ?? user
}

async function registerWithGoogle(input: GoogleRegisterInput = {}): Promise<User> {
  const user = await signInWithGoogle()
  const existingProfile = await usersService.getUserById(user.uid)

  if (existingProfile) {
    await syncEmailVerificationStatus(user)
    return getFirebaseAuth().currentUser ?? user
  }

  const email = user.email?.trim() ?? ''

  if (!email) {
    await signOut(getFirebaseAuth())
    throw new Error('Tu cuenta de Google no tiene un correo asociado.')
  }

  const displayName = user.displayName?.trim() || email.split('@')[0] || 'Usuario'
  let inviteValidation: InviteValidationResult | null = null
  let recommendationAttribution: RecommendationAttribution | null = null

  if (input.inviteCode?.trim()) {
    inviteValidation = await teamService.validateInviteCode(input.inviteCode)

    if (!inviteValidation.valid) {
      throw new Error(inviteValidation.message)
    }
  }

  if (resolveRecommendationCodeFromInput(input)) {
    recommendationAttribution = await resolveRecommendationAttribution(input)

    if (!recommendationAttribution && !inviteValidation?.valid) {
      throw new Error('El código de recomendación no es válido o ya no está activo.')
    }
  }

  const registrationInput: RegisterInput = {
    displayName,
    email,
    password: '',
    referralCodeFromUrl: input.referralCodeFromUrl,
    recommendationCodeFromUrl: input.recommendationCodeFromUrl,
    inviteCode: input.inviteCode,
  }

  if (inviteValidation?.valid) {
    await createInvitedMemberRegistrationDocuments(
      user,
      registrationInput,
      inviteValidation.invite,
      recommendationAttribution,
    )
  } else if (recommendationAttribution) {
    await createRecommendedUserRegistrationDocuments(user, registrationInput, recommendationAttribution)
  } else {
    const referralCode = await ensureUniqueReferralCode()
    const slug = await ensureUniqueSlug(displayName)

    await createRegistrationDocuments(user, registrationInput, referralCode, slug)
  }

  await syncEmailVerificationStatus(user)

  return getFirebaseAuth().currentUser ?? user
}

async function reloadCurrentUser(user: User): Promise<User> {
  await reload(user)

  const refreshedUser = getFirebaseAuth().currentUser

  if (!refreshedUser) {
    throw new Error('No se pudo actualizar la sesión.')
  }

  await syncEmailVerificationStatus(refreshedUser)

  return refreshedUser
}

async function sendVerificationEmailToUser(user: User): Promise<void> {
  await sendEmailVerification(user)
}

async function syncEmailVerificationStatus(user: User): Promise<void> {
  if (!user.emailVerified) {
    return
  }

  await ensureFreshAuthToken(user)

  try {
    const profile = await usersService.getUserById(user.uid)

    if (!profile) {
      return
    }

    if (!profile.emailVerified || profile.status === 'pending_verification') {
      await usersService.updateUserProfile(user.uid, {
        emailVerified: true,
        status: 'active',
      })
    }
  } catch {
    // No bloquear login/sesión si la sync del perfil falla; se reintenta en la próxima sesión.
  }
}

export function userHasPasswordProvider(user: User | null | undefined): boolean {
  return Boolean(user?.providerData.some((provider) => provider.providerId === 'password'))
}

async function reauthenticateWithPassword(user: User, currentPassword: string): Promise<void> {
  const email = user.email?.trim()

  if (!email) {
    throw new Error('Tu cuenta no tiene correo asociado.')
  }

  const credential = EmailAuthProvider.credential(email, currentPassword)
  await reauthenticateWithCredential(user, credential)
}

async function changePasswordWithReauth(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = getFirebaseAuth().currentUser

  if (!user) {
    throw new Error('No hay una sesión activa.')
  }

  if (!userHasPasswordProvider(user)) {
    throw new Error('Tu cuenta usa inicio con Google. Usa recuperar contraseña si necesitas acceso por correo.')
  }

  try {
    await reauthenticateWithPassword(user, currentPassword)
    await updatePassword(user, newPassword)
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(mapFirebaseAuthError(error.code))
    }

    throw error
  }
}

async function changeEmailWithReauth(currentPassword: string, newEmail: string): Promise<void> {
  const user = getFirebaseAuth().currentUser

  if (!user) {
    throw new Error('No hay una sesión activa.')
  }

  if (!userHasPasswordProvider(user)) {
    throw new Error('El cambio de correo con Google requiere un flujo específico. Contacta soporte si lo necesitas.')
  }

  const normalizedEmail = newEmail.trim()

  try {
    await reauthenticateWithPassword(user, currentPassword)
    await verifyBeforeUpdateEmail(user, normalizedEmail)
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(mapFirebaseAuthError(error.code))
    }

    throw error
  }
}

export const authService = {
  registerWithEmail,
  /** @deprecated Use registerWithEmail */
  registerLeaderWithEmail: registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  registerWithGoogle,
  sendPasswordResetEmail: sendPasswordResetEmailToUser,
  reloadCurrentUser,
  sendVerificationEmailToUser,
  syncEmailVerificationStatus,
  ensureFreshAuthToken,
  changePasswordWithReauth,
  changeEmailWithReauth,
}
