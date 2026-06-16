import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { ensureUniqueReferralCode, ensureUniqueSlug } from '@/features/auth/utils/uniqueness'
import { teamService } from '@/features/team/services/team.service'
import type { InviteValidationResult, LeaderInviteCode } from '@/features/team/types/team.types'
import { COLLECTIONS, getFirebaseDb, getFirebaseAuth } from '@/lib/firebase'
import { usersService } from '@/services/users.service'
import type { GoogleRegisterInput, RegisterInput } from '@/features/auth/types'

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
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const timestamp = serverTimestamp()
  const displayName = input.displayName.trim()
  const email = input.email.trim()
  const photoURL = user.photoURL ?? ''
  const memberId = `${invite.teamId}_${user.uid}`
  const memberName = displayName || email.split('@')[0] || 'Usuario'

  batch.set(doc(db, COLLECTIONS.users, user.uid), {
    uid: user.uid,
    email,
    displayName,
    phone: '',
    photoURL,
    role: 'member',
    leaderId: invite.ownerUid,
    homeTeamId: invite.teamId,
    activationStatus: 'none',
    status: 'pending_verification',
    emailVerified: false,
    createdAt: timestamp,
    updatedAt: timestamp,
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

  if (input.inviteCode?.trim()) {
    inviteValidation = await teamService.validateInviteCode(input.inviteCode)

    if (!inviteValidation.valid) {
      throw new Error(inviteValidation.message)
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
    await createInvitedMemberRegistrationDocuments(user, input, inviteValidation.invite)
  } else {
    const referralCode = await ensureUniqueReferralCode()
    const slug = await ensureUniqueSlug(input.displayName)
    await createRegistrationDocuments(user, input, referralCode, slug)
  }

  void input.referralCodeFromUrl

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

  if (input.inviteCode?.trim()) {
    inviteValidation = await teamService.validateInviteCode(input.inviteCode)

    if (!inviteValidation.valid) {
      throw new Error(inviteValidation.message)
    }
  }

  if (inviteValidation?.valid) {
    await createInvitedMemberRegistrationDocuments(
      user,
      {
        displayName,
        email,
        password: '',
        referralCodeFromUrl: input.referralCodeFromUrl,
        inviteCode: input.inviteCode,
      },
      inviteValidation.invite,
    )
  } else {
    const referralCode = await ensureUniqueReferralCode()
    const slug = await ensureUniqueSlug(displayName)

    await createRegistrationDocuments(
      user,
      {
        displayName,
        email,
        password: '',
        referralCodeFromUrl: input.referralCodeFromUrl,
      },
      referralCode,
      slug,
    )
  }

  void input.referralCodeFromUrl

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
}
