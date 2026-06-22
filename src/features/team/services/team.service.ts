import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import type {
  InviteValidationResult,
  LeaderInviteCode,
  Team,
  TeamMember,
} from '@/features/team/types/team.types'
import { INVALID_INVITE_CODE_MESSAGE } from '@/features/team/types/team.types'
import {
  buildDefaultTeamName,
  generateInviteCode,
  validateTeamName,
} from '@/features/team/utils/teamInviteUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import { usersService } from '@/services/users.service'
import { normalizeReferralUpline } from '@/features/referrals/utils/referralUplineUtils'

const MAX_INVITE_CODE_ATTEMPTS = 12

function mapTeamDocument(id: string, data: DocumentData): Team {
  return {
    id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    name: typeof data.name === 'string' ? data.name : '',
    inviteCode: typeof data.inviteCode === 'string' ? data.inviteCode : '',
    status: data.status === 'active' ? 'active' : 'active',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function mapTeamMemberDocument(id: string, data: DocumentData): TeamMember {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    memberUid: typeof data.memberUid === 'string' ? data.memberUid : '',
    memberName:
      typeof data.memberName === 'string' && data.memberName.trim().length > 0
        ? data.memberName.trim()
        : undefined,
    memberEmail:
      typeof data.memberEmail === 'string' && data.memberEmail.trim().length > 0
        ? data.memberEmail.trim()
        : undefined,
    role: data.role === 'owner' ? 'owner' : 'member',
    status: data.status === 'active' ? 'active' : 'active',
    ownedTeamId: typeof data.ownedTeamId === 'string' ? data.ownedTeamId : undefined,
    activationStatus:
      data.activationStatus === 'active' ||
      data.activationStatus === 'none' ||
      data.activationStatus === 'pending' ||
      data.activationStatus === 'rejected' ||
      data.activationStatus === 'expired'
        ? data.activationStatus
        : undefined,
    joinedAt: data.joinedAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

function mapLeaderInviteCodeDocument(code: string, data: DocumentData): LeaderInviteCode {
  return {
    code,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    teamName: typeof data.teamName === 'string' ? data.teamName : undefined,
    ownerReferralUpline: Array.isArray(data.ownerReferralUpline)
      ? normalizeReferralUpline({
          rawChain: data.ownerReferralUpline,
          selfUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
        })
      : undefined,
    isActive: data.isActive === true,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

async function readOwnerReferralUplineSnapshot(ownerUid: string): Promise<string[]> {
  try {
    const profile = await usersService.getUserById(ownerUid.trim())

    return normalizeReferralUpline({
      rawChain: profile?.referralUpline,
      selfUid: ownerUid.trim(),
    })
  } catch {
    return []
  }
}

function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase()
}

async function getTeamById(teamId: string): Promise<Team | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.teams, teamId))

  if (!snapshot.exists()) {
    return null
  }

  return mapTeamDocument(snapshot.id, snapshot.data())
}

async function getInviteCodeByCode(code: string): Promise<LeaderInviteCode | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.leaderInviteCodes, code))

  if (!snapshot.exists()) {
    return null
  }

  return mapLeaderInviteCodeDocument(snapshot.id, snapshot.data())
}

async function validateInviteCode(code: string): Promise<InviteValidationResult> {
  const normalizedCode = normalizeInviteCode(code)

  if (!normalizedCode) {
    return { valid: false, message: INVALID_INVITE_CODE_MESSAGE }
  }

  const invite = await getInviteCodeByCode(normalizedCode)

  if (!invite || !invite.isActive) {
    return { valid: false, message: INVALID_INVITE_CODE_MESSAGE }
  }

  const team =
    (invite.teamName
      ? {
          id: invite.teamId,
          ownerUid: invite.ownerUid,
          name: invite.teamName,
          inviteCode: invite.code,
          status: 'active' as const,
          createdAt: null,
          updatedAt: null,
        }
      : null) ?? (await getTeamById(invite.teamId))

  if (!team || team.status !== 'active') {
    return { valid: false, message: INVALID_INVITE_CODE_MESSAGE }
  }

  return { valid: true, invite, team }
}

async function joinTeamByInviteCode(uid: string, code: string): Promise<Team> {
  const validation = await validateInviteCode(code)

  if (!validation.valid) {
    throw new Error(validation.message)
  }

  const { invite, team } = validation
  const db = getFirebaseDb()
  const memberId = `${invite.teamId}_${uid}`
  const memberRef = doc(db, COLLECTIONS.teamMembers, memberId)
  const existingMember = await getDoc(memberRef)

  if (existingMember.exists()) {
    return team
  }

  const now = serverTimestamp()

  await setDoc(memberRef, {
    teamId: invite.teamId,
    ownerUid: invite.ownerUid,
    memberUid: uid,
    role: 'member',
    status: 'active',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  return team
}

async function getUserTeam(
  uid: string,
  _userDisplayNameOrEmail: string,
  profile?: {
    homeTeamId?: string
    ownedTeamId?: string
    role?: string
    activationStatus?: string
  } | null,
): Promise<Team | null> {
  if (profile?.ownedTeamId) {
    const ownedTeam = await getTeamById(profile.ownedTeamId)

    if (ownedTeam) {
      return ownedTeam
    }
  }

  if (profile?.activationStatus === 'active') {
    const activeOwnedTeam = await getMyTeam(uid)

    if (activeOwnedTeam) {
      return activeOwnedTeam
    }

    return null
  }

  if (profile?.homeTeamId) {
    return getTeamById(profile.homeTeamId)
  }

  const legacyOwnedTeam = await getMyTeam(uid)

  if (legacyOwnedTeam) {
    return legacyOwnedTeam
  }

  return null
}

async function appendOwnedTeamToBatch(
  batch: ReturnType<typeof writeBatch>,
  uid: string,
  displayNameOrEmail: string,
  now: ReturnType<typeof serverTimestamp>,
): Promise<string> {
  const db = getFirebaseDb()
  const inviteCode = await generateUniqueInviteCode()
  const teamName = buildDefaultTeamName(displayNameOrEmail)
  const teamRef = doc(collection(db, COLLECTIONS.teams))
  const teamId = teamRef.id
  const memberId = `${teamId}_${uid}`
  const ownerReferralUpline = await readOwnerReferralUplineSnapshot(uid)

  batch.set(teamRef, {
    ownerUid: uid,
    name: teamName,
    inviteCode,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  batch.set(doc(db, COLLECTIONS.leaderInviteCodes, inviteCode), {
    code: inviteCode,
    ownerUid: uid,
    teamId,
    teamName,
    ...(ownerReferralUpline.length > 0 ? { ownerReferralUpline } : {}),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  batch.set(doc(db, COLLECTIONS.teamMembers, memberId), {
    teamId,
    ownerUid: uid,
    memberUid: uid,
    role: 'owner',
    status: 'active',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  return teamId
}

async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode()
    const existing = await getInviteCodeByCode(code)

    if (!existing) {
      return code
    }
  }

  throw new Error('No se pudo generar un código de invitación único. Intenta nuevamente.')
}

async function getActiveTeamMembershipsByMemberUid(uid: string): Promise<TeamMember[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.teamMembers),
      where('memberUid', '==', uid),
    ),
  )

  return snapshot.docs
    .map((memberDoc) => mapTeamMemberDocument(memberDoc.id, memberDoc.data()))
    .filter((member) => member.status === 'active')
}

async function resolveHomeTeamIdForAcademy(
  uid: string,
  profileHomeTeamId?: string | null,
  ownedTeamId?: string | null,
): Promise<string | null> {
  const owned = ownedTeamId?.trim() || null
  const profileHome = profileHomeTeamId?.trim() || null

  if (profileHome && profileHome !== owned) {
    return profileHome
  }

  const memberships = await getActiveTeamMembershipsByMemberUid(uid)
  const memberOfExternalTeam = memberships.find(
    (membership) =>
      membership.teamId !== owned &&
      membership.memberUid === uid &&
      membership.role === 'member',
  )

  if (memberOfExternalTeam) {
    return memberOfExternalTeam.teamId
  }

  const alternateMembership = memberships.find((membership) => membership.teamId !== owned)

  return alternateMembership?.teamId ?? null
}

async function getTeamMembersByTeamId(teamId: string, ownerUid: string): Promise<TeamMember[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.teamMembers),
      where('teamId', '==', teamId),
      where('ownerUid', '==', ownerUid),
    ),
  )

  return snapshot.docs.map((memberDoc) => mapTeamMemberDocument(memberDoc.id, memberDoc.data()))
}

async function getMyTeam(uid: string): Promise<Team | null> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), COLLECTIONS.teams), where('ownerUid', '==', uid)),
  )

  const teamDoc = snapshot.docs[0]

  if (!teamDoc) {
    return null
  }

  return mapTeamDocument(teamDoc.id, teamDoc.data())
}

async function ensureMyTeam(uid: string, userDisplayNameOrEmail: string): Promise<Team> {
  const existingTeam = await getMyTeam(uid)

  if (existingTeam) {
    return existingTeam
  }

  const inviteCode = await generateUniqueInviteCode()
  const teamName = buildDefaultTeamName(userDisplayNameOrEmail)
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const teamRef = doc(collection(db, COLLECTIONS.teams))
  const teamId = teamRef.id
  const memberId = `${teamId}_${uid}`
  const now = serverTimestamp()
  const ownerReferralUpline = await readOwnerReferralUplineSnapshot(uid)

  batch.set(teamRef, {
    ownerUid: uid,
    name: teamName,
    inviteCode,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  batch.set(doc(db, COLLECTIONS.leaderInviteCodes, inviteCode), {
    code: inviteCode,
    ownerUid: uid,
    teamId,
    teamName,
    ...(ownerReferralUpline.length > 0 ? { ownerReferralUpline } : {}),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  batch.set(doc(db, COLLECTIONS.teamMembers, memberId), {
    teamId,
    ownerUid: uid,
    memberUid: uid,
    role: 'owner',
    status: 'active',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  await batch.commit()

  const timestamp = Timestamp.now()

  return {
    id: teamId,
    ownerUid: uid,
    name: teamName,
    inviteCode,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

async function ensureActiveUserOwnedTeam(
  uid: string,
  displayNameOrEmail: string,
): Promise<{ team: Team; teamId: string; created: boolean; synced: boolean }> {
  const userProfile = await usersService.getUserById(uid)

  if (userProfile?.ownedTeamId) {
    const existingOwnedTeam = await getTeamById(userProfile.ownedTeamId)

    if (existingOwnedTeam) {
      return {
        team: existingOwnedTeam,
        teamId: existingOwnedTeam.id,
        created: false,
        synced: false,
      }
    }
  }

  let team = await getMyTeam(uid)
  let created = false

  if (!team) {
    team = await ensureMyTeam(uid, displayNameOrEmail)
    created = true
  }

  let synced = false

  if (!userProfile?.ownedTeamId || userProfile.ownedTeamId !== team.id) {
    await usersService.syncOwnedTeamId(uid, team.id)
    synced = true
  }

  return {
    team,
    teamId: team.id,
    created,
    synced,
  }
}

async function getTeamOwnerOwnedTeamId(ownerUid: string): Promise<string | null> {
  try {
    const profile = await usersService.getUserById(ownerUid)
    return profile?.ownedTeamId?.trim() || null
  } catch {
    return null
  }
}

async function getTeamLeaderDisplayName(
  ownerUid: string,
  fallback = 'Líder del grupo',
): Promise<string> {
  try {
    const profile = await usersService.getUserById(ownerUid)
    return profile?.displayName?.trim() || profile?.email?.trim() || fallback
  } catch {
    return fallback
  }
}

async function verifyActiveOwnedTeamForOwner(
  ownedTeamId: string,
  ownerUid: string,
): Promise<Team | null> {
  const team = await getTeamById(ownedTeamId.trim())

  if (!team || team.status !== 'active') {
    return null
  }

  if (team.ownerUid.trim() !== ownerUid.trim()) {
    return null
  }

  return team
}

async function syncHomeTeamMemberLeaderDenormalization(
  homeTeamId: string,
  memberUid: string,
  ownedTeamId: string,
): Promise<void> {
  const normalizedHomeTeamId = homeTeamId.trim()
  const normalizedMemberUid = memberUid.trim()
  const normalizedOwnedTeamId = ownedTeamId.trim()

  if (!normalizedHomeTeamId || !normalizedMemberUid || !normalizedOwnedTeamId) {
    return
  }

  await updateDoc(
    doc(getFirebaseDb(), COLLECTIONS.teamMembers, `${normalizedHomeTeamId}_${normalizedMemberUid}`),
    {
      ownedTeamId: normalizedOwnedTeamId,
      activationStatus: 'active',
      updatedAt: serverTimestamp(),
    },
  )
}

async function updateTeamName(teamId: string, uid: string, name: string): Promise<Team> {
  const trimmedName = name.trim()
  const validationError = validateTeamName(trimmedName)

  if (validationError) {
    throw new Error(validationError)
  }

  const teamRef = doc(getFirebaseDb(), COLLECTIONS.teams, teamId)
  const snapshot = await getDoc(teamRef)

  if (!snapshot.exists()) {
    throw new Error('No encontramos tu grupo.')
  }

  const data = snapshot.data()

  if (typeof data.ownerUid !== 'string' || data.ownerUid !== uid) {
    throw new Error('No tienes permiso para editar este grupo.')
  }

  await updateDoc(teamRef, {
    name: trimmedName,
    updatedAt: serverTimestamp(),
  })

  return {
    ...mapTeamDocument(teamId, data),
    name: trimmedName,
    updatedAt: Timestamp.now(),
  }
}

export const teamService = {
  getMyTeam,
  getTeamById,
  getUserTeam,
  getTeamMembersByTeamId,
  getActiveTeamMembershipsByMemberUid,
  resolveHomeTeamIdForAcademy,
  getTeamOwnerOwnedTeamId,
  getTeamLeaderDisplayName,
  verifyActiveOwnedTeamForOwner,
  syncHomeTeamMemberLeaderDenormalization,
  ensureMyTeam,
  ensureActiveUserOwnedTeam,
  appendOwnedTeamToBatch,
  updateTeamName,
  validateInviteCode,
  joinTeamByInviteCode,
  generateUniqueInviteCode,
  getInviteCodeByCode,
}
