/**
 * Auditoría y corrección controlada de referralUpline + rewards faltantes.
 *
 * Uso:
 *   npm run audit:referral-chain
 *   APPLY=true npm run audit:referral-chain
 *   REGENERATE_REWARDS=true APPLY=true npm run audit:referral-chain
 *
 * Emails por defecto: caso de prueba Emily → Christian → Pablo.
 * Override: AUDIT_EMAILS=email1,email2,email3
 * Beneficiario raíz (opcional): ROOT_BENEFICIARY_EMAIL=cristofer@...
 *
 * SECURITY: requiere serviceAccountKey.json o GOOGLE_APPLICATION_CREDENTIALS.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert, getApps, getApp, type ServiceAccount } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore'

const DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID?.trim() ||
  process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
  'default'

const APPLY = process.env.APPLY === 'true'
const REGENERATE_REWARDS = process.env.REGENERATE_REWARDS === 'true'
const EXPANSION_ANNUAL_PRICE_EUR = 160
const MAX_REFERRAL_LEVELS = 3
const FIREBASE_UID_PATTERN = /^[a-zA-Z0-9]{20,128}$/

const DEFAULT_AUDIT_EMAILS = [
  'wzf8cuxaxb@bltiwd.com',
  '6kj6mrsrv8@wnbaldwy.com',
  'y8blapp6u0@ozsaip.com',
]

const AUDIT_EMAILS = (process.env.AUDIT_EMAILS?.trim() || DEFAULT_AUDIT_EMAILS.join(','))
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const ROOT_BENEFICIARY_EMAIL = process.env.ROOT_BENEFICIARY_EMAIL?.trim().toLowerCase() || ''

const REFERRAL_UID_FIELDS = [
  'invitedBy',
  'referredBy',
  'sponsorUid',
  'parentUid',
  'leaderId',
] as const

const TEAM_MEMBER_REFERRER_FIELDS = ['invitedByUid', 'sponsorUid', 'parentUid'] as const

const REFERRAL_REWARD_AMOUNTS: Record<1 | 2 | 3, number> = {
  1: 30,
  2: 20,
  3: 10,
}

type AuditUser = {
  uid: string
  email: string
  profile: DocumentData
}

function fail(message: string): never {
  console.error(`[EXPANSIÓN audit:referral-chain] ${message}`)
  process.exit(1)
}

function loadServiceAccount(): ServiceAccount {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()

  if (credentialsPath) {
    if (!existsSync(credentialsPath)) {
      fail(`GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo inexistente: ${credentialsPath}`)
    }

    return JSON.parse(readFileSync(credentialsPath, 'utf8')) as ServiceAccount
  }

  const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json')

  if (existsSync(localKeyPath)) {
    return JSON.parse(readFileSync(localKeyPath, 'utf8')) as ServiceAccount
  }

  fail(
    'No se encontró credencial de servicio. Coloca serviceAccountKey.json en la raíz o define GOOGLE_APPLICATION_CREDENTIALS.',
  )
}

function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return
  }

  initializeApp({
    credential: cert(loadServiceAccount()),
  })
}

function readNonEmptyUid(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeReferralUpline(rawChain: unknown, selfUid: string): string[] {
  if (!Array.isArray(rawChain)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of rawChain) {
    const uid = readNonEmptyUid(item)

    if (!uid || !FIREBASE_UID_PATTERN.test(uid) || uid === selfUid || seen.has(uid)) {
      continue
    }

    seen.add(uid)
    result.push(uid)

    if (result.length >= MAX_REFERRAL_LEVELS) {
      break
    }
  }

  return result
}

function readUidFromRecord(data: DocumentData, keys: readonly string[]): string | null {
  for (const key of keys) {
    const uid = readNonEmptyUid(data[key])

    if (uid) {
      return uid
    }
  }

  return null
}

function isReferralUplineIncomplete(existing: string[], expected: string[]): boolean {
  if (expected.length === 0) {
    return false
  }

  if (existing.length === 0) {
    return true
  }

  if (existing.length > expected.length) {
    return false
  }

  return (
    expected.slice(0, existing.length).every((uid, index) => existing[index] === uid) &&
    existing.length < expected.length
  )
}

function buildReferralUplineFromInviter(
  inviterUid: string,
  selfUid: string,
  inviterReferralUpline?: unknown,
): string[] {
  const normalizedInviterUid = inviterUid.trim()

  if (!normalizedInviterUid || normalizedInviterUid === selfUid.trim()) {
    return []
  }

  const inviterUpline = normalizeReferralUpline(inviterReferralUpline ?? [], selfUid)

  return normalizeReferralUpline(
    [normalizedInviterUid, ...inviterUpline.slice(0, MAX_REFERRAL_LEVELS - 1)],
    selfUid,
  )
}

async function getUserData(
  db: FirebaseFirestore.Firestore,
  uid: string,
): Promise<DocumentData | null> {
  const snapshot = await db.collection('users').doc(uid).get()
  return snapshot.exists ? snapshot.data() ?? null : null
}

async function resolveReferrerUidForUser(
  db: FirebaseFirestore.Firestore,
  uid: string,
): Promise<string | null> {
  const profile = await getUserData(db, uid)

  if (!profile) {
    return null
  }

  const referrerUid = readUidFromRecord(profile, REFERRAL_UID_FIELDS)

  if (!referrerUid || referrerUid === uid) {
    return null
  }

  return referrerUid
}

async function buildExpectedReferralUpline(
  db: FirebaseFirestore.Firestore,
  uid: string,
  profile: DocumentData,
): Promise<string[]> {
  const homeTeamId = readNonEmptyUid(profile.homeTeamId) ?? ''
  const chain: string[] = []
  const seen = new Set<string>([uid])

  let nextReferrerUid = readUidFromRecord(profile, REFERRAL_UID_FIELDS)

  if ((!nextReferrerUid || nextReferrerUid === uid) && homeTeamId) {
    const memberSnapshot = await db.collection('teamMembers').doc(`${homeTeamId}_${uid}`).get()

    if (memberSnapshot.exists) {
      const memberData = memberSnapshot.data() ?? {}
      nextReferrerUid =
        readUidFromRecord(memberData, TEAM_MEMBER_REFERRER_FIELDS) ??
        (() => {
          const ownerUid = readNonEmptyUid(memberData.ownerUid)
          const memberUid = readNonEmptyUid(memberData.memberUid)
          return ownerUid && memberUid && ownerUid !== memberUid && ownerUid !== uid
            ? ownerUid
            : null
        })()
    }
  }

  while (nextReferrerUid && chain.length < MAX_REFERRAL_LEVELS) {
    if (seen.has(nextReferrerUid)) {
      break
    }

    seen.add(nextReferrerUid)
    chain.push(nextReferrerUid)
    nextReferrerUid = await resolveReferrerUidForUser(db, nextReferrerUid)
  }

  return chain
}

function referralUplineToRewardChain(
  referralUpline: string[],
): Array<{ level: 1 | 2 | 3; beneficiaryUid: string }> {
  return referralUpline.map((beneficiaryUid, index) => ({
    level: (index + 1) as 1 | 2 | 3,
    beneficiaryUid,
  }))
}

function getReferralRewardId(
  activationRequestId: string,
  level: 1 | 2 | 3,
  beneficiaryUid: string,
): string {
  return `${activationRequestId.trim()}_L${level}_${beneficiaryUid.trim()}`
}

async function findUserByEmail(
  db: FirebaseFirestore.Firestore,
  email: string,
): Promise<AuditUser | null> {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get()

  if (snapshot.empty) {
    return null
  }

  const userDoc = snapshot.docs[0]
  const profile = userDoc.data()

  return {
    uid: userDoc.id,
    email,
    profile,
  }
}

async function printUserAudit(db: FirebaseFirestore.Firestore, user: AuditUser): Promise<void> {
  const { uid, email, profile } = user
  const homeTeamId = readNonEmptyUid(profile.homeTeamId) ?? ''
  const currentUpline = normalizeReferralUpline(profile.referralUpline, uid)
  const expectedUpline = await buildExpectedReferralUpline(db, uid, profile)

  console.log('\n---')
  console.log(`Usuario: ${profile.displayName ?? profile.name ?? '(sin nombre)'} <${email}>`)
  console.log(`  uid: ${uid}`)
  console.log(`  activationStatus: ${profile.activationStatus ?? '(missing)'}`)
  console.log(`  ownedTeamId: ${profile.ownedTeamId ?? '(missing)'}`)
  console.log(`  homeTeamId: ${homeTeamId || '(missing)'}`)
  console.log(`  leaderId: ${profile.leaderId ?? '(missing)'}`)
  console.log(`  referredBy: ${profile.referredBy ?? '(missing)'}`)
  console.log(`  invitedBy: ${profile.invitedBy ?? '(missing)'}`)
  console.log(`  sponsorUid: ${profile.sponsorUid ?? '(missing)'}`)
  console.log(`  parentUid: ${profile.parentUid ?? '(missing)'}`)
  console.log(`  referralUpline (actual): [${currentUpline.join(', ')}]`)
  console.log(`  referralUplineSource: ${profile.referralUplineSource ?? '(missing)'}`)
  console.log(`  referralUpline (esperada): [${expectedUpline.join(', ')}]`)
  console.log(
    `  incompleta: ${isReferralUplineIncomplete(currentUpline, expectedUpline) ? 'SÍ' : 'NO'}`,
  )

  const memberQuery = await db.collection('teamMembers').where('memberUid', '==', uid).get()
  console.log(`  teamMembers (memberUid==uid): ${memberQuery.size}`)

  for (const memberDoc of memberQuery.docs) {
    const memberData = memberDoc.data()
    console.log(`    - ${memberDoc.id}`)
    console.log(`      ownerUid: ${memberData.ownerUid ?? '(missing)'}`)
    console.log(`      invitedByUid: ${memberData.invitedByUid ?? '(missing)'}`)
    console.log(`      sponsorUid: ${memberData.sponsorUid ?? '(missing)'}`)
    console.log(`      parentUid: ${memberData.parentUid ?? '(missing)'}`)
  }

  if (homeTeamId) {
    const canonicalMemberId = `${homeTeamId}_${uid}`
    const canonicalMember = await db.collection('teamMembers').doc(canonicalMemberId).get()

    if (canonicalMember.exists) {
      const memberData = canonicalMember.data() ?? {}
      console.log(`  teamMembers/${canonicalMemberId}: existe`)
      console.log(`    ownerUid: ${memberData.ownerUid ?? '(missing)'}`)
    } else {
      console.log(`  teamMembers/${canonicalMemberId}: no existe`)
    }
  }

  const activationSnapshot = await db
    .collection('groupActivationRequests')
    .where('requesterUid', '==', uid)
    .get()

  console.log(`  groupActivationRequests: ${activationSnapshot.size}`)

  for (const requestDoc of activationSnapshot.docs) {
    const requestData = requestDoc.data()
    console.log(
      `    - ${requestDoc.id}: status=${requestData.status}, amount=${requestData.amount}, currency=${requestData.currency}`,
    )
  }

  const rewardsForActivation = await db
    .collection('referralRewards')
    .where('activatedUserUid', '==', uid)
    .get()

  console.log(`  referralRewards (activatedUserUid==uid): ${rewardsForActivation.size}`)

  for (const rewardDoc of rewardsForActivation.docs) {
    const rewardData = rewardDoc.data()
    console.log(
      `    - ${rewardDoc.id}: level=${rewardData.level}, beneficiaryUid=${rewardData.beneficiaryUid}, amount=${rewardData.amount}`,
    )
  }
}

async function repairReferralUplineIfNeeded(
  db: FirebaseFirestore.Firestore,
  user: AuditUser,
): Promise<{ repaired: boolean; chain: string[] }> {
  const currentUpline = normalizeReferralUpline(user.profile.referralUpline, user.uid)
  const expectedUpline = await buildExpectedReferralUpline(db, user.uid, user.profile)

  if (!isReferralUplineIncomplete(currentUpline, expectedUpline)) {
    return { repaired: false, chain: currentUpline }
  }

  if (!APPLY) {
    console.log(
      `[DRY RUN] Corregiría users/${user.uid} referralUpline: [${currentUpline.join(', ')}] → [${expectedUpline.join(', ')}]`,
    )
    return { repaired: false, chain: expectedUpline }
  }

  await db.collection('users').doc(user.uid).set(
    {
      referralUpline: expectedUpline,
      referralUplineSource: 'backfill',
      referralUplineUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log(
    `[APPLY] users/${user.uid} referralUpline corregida: [${expectedUpline.join(', ')}]`,
  )

  user.profile.referralUpline = expectedUpline
  return { repaired: true, chain: expectedUpline }
}

async function regenerateMissingRewardsForUser(
  db: FirebaseFirestore.Firestore,
  user: AuditUser,
): Promise<void> {
  if (user.profile.activationStatus !== 'active') {
    console.log(`[Rewards] Skip ${user.email}: activationStatus != active`)
    return
  }

  const activationSnapshot = await db
    .collection('groupActivationRequests')
    .where('requesterUid', '==', user.uid)
    .where('status', '==', 'approved')
    .get()

  if (activationSnapshot.empty) {
    console.log(`[Rewards] Skip ${user.email}: sin groupActivationRequest approved`)
    return
  }

  const referralUpline = normalizeReferralUpline(user.profile.referralUpline, user.uid)

  if (referralUpline.length === 0) {
    console.log(`[Rewards] Skip ${user.email}: referralUpline vacía`)
    return
  }

  const rewardChain = referralUplineToRewardChain(referralUpline)

  for (const requestDoc of activationSnapshot.docs) {
    const requestData = requestDoc.data()
    const activationRequestId = requestDoc.id
    const amount = typeof requestData.amount === 'number' ? requestData.amount : 0
    const currency = typeof requestData.currency === 'string' ? requestData.currency : 'EUR'

    if (amount !== EXPANSION_ANNUAL_PRICE_EUR || currency !== 'EUR') {
      console.log(
        `[Rewards] Skip request ${activationRequestId}: amount/currency no corresponde a activación anual (${amount} ${currency})`,
      )
      continue
    }

    const homeTeamId = readNonEmptyUid(requestData.currentHomeTeamId) ?? ''
    const ownedTeamId = readNonEmptyUid(user.profile.ownedTeamId)
    const activatedUserName =
      typeof requestData.requesterName === 'string' ? requestData.requesterName : ''
    const activatedUserEmail =
      typeof requestData.requesterEmail === 'string' ? requestData.requesterEmail : user.email

    for (const entry of rewardChain) {
      const rewardId = getReferralRewardId(activationRequestId, entry.level, entry.beneficiaryUid)
      const rewardRef = db.collection('referralRewards').doc(rewardId)
      const existingReward = await rewardRef.get()

      if (existingReward.exists) {
        console.log(`[Rewards] Skip existente: ${rewardId}`)
        continue
      }

      if (!APPLY || !REGENERATE_REWARDS) {
        console.log(
          `[DRY RUN] Crearía referralRewards/${rewardId} (level ${entry.level}, ${REFERRAL_REWARD_AMOUNTS[entry.level]} EUR → ${entry.beneficiaryUid})`,
        )
        continue
      }

      const beneficiaryProfile = await getUserData(db, entry.beneficiaryUid)

      await rewardRef.set({
        rewardId,
        activationRequestId,
        activatedUserUid: user.uid,
        activatedUserName: activatedUserName.trim() || null,
        activatedUserEmail: activatedUserEmail.trim() || null,
        beneficiaryUid: entry.beneficiaryUid,
        beneficiaryName:
          (typeof beneficiaryProfile?.displayName === 'string'
            ? beneficiaryProfile.displayName
            : null) ?? null,
        beneficiaryEmail:
          (typeof beneficiaryProfile?.email === 'string' ? beneficiaryProfile.email : null) ?? null,
        level: entry.level,
        amount: REFERRAL_REWARD_AMOUNTS[entry.level],
        currency: 'EUR',
        source: 'group_activation',
        status: 'payable',
        reason: 'Recompensa regenerada por script audit-referral-chain (rewards faltantes).',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        payableAt: FieldValue.serverTimestamp(),
        metadata: {
          activatedHomeTeamId: homeTeamId || null,
          activatedOwnedTeamId: ownedTeamId,
          referralPath: rewardChain.map((chainEntry) => chainEntry.beneficiaryUid),
          regeneratedBy: 'audit-referral-chain',
        },
      })

      console.log(`[Rewards] Creado: ${rewardId}`)
    }
  }
}

async function printRootBeneficiaryRewards(
  db: FirebaseFirestore.Firestore,
  rootUid: string,
  activatedUids: string[],
): Promise<void> {
  console.log(`\n=== referralRewards para beneficiario raíz ${rootUid} ===`)

  for (const activatedUid of activatedUids) {
    const rewardsSnapshot = await db
      .collection('referralRewards')
      .where('activatedUserUid', '==', activatedUid)
      .where('beneficiaryUid', '==', rootUid)
      .get()

    console.log(`  activatedUserUid=${activatedUid}: ${rewardsSnapshot.size} reward(s)`)

    for (const rewardDoc of rewardsSnapshot.docs) {
      const rewardData = rewardDoc.data()
      console.log(
        `    - ${rewardDoc.id}: level=${rewardData.level}, amount=${rewardData.amount}, status=${rewardData.status}`,
      )
    }
  }
}

async function main(): Promise<void> {
  initFirebaseAdmin()

  const db = getFirestore(getApp(), DATABASE_ID)

  console.log(`[EXPANSIÓN audit:referral-chain] Firestore databaseId: ${DATABASE_ID}`)
  console.log(`[EXPANSIÓN audit:referral-chain] APPLY=${APPLY}`)
  console.log(`[EXPANSIÓN audit:referral-chain] REGENERATE_REWARDS=${REGENERATE_REWARDS}`)
  console.log(`[EXPANSIÓN audit:referral-chain] Emails: ${AUDIT_EMAILS.join(', ')}`)

  const users: AuditUser[] = []

  for (const email of AUDIT_EMAILS) {
    const user = await findUserByEmail(db, email)

    if (!user) {
      console.warn(`[WARN] No se encontró usuario con email: ${email}`)
      continue
    }

    users.push(user)
    await printUserAudit(db, user)
  }

  if (users.length === 0) {
    fail('No se encontró ningún usuario para auditar.')
  }

  let rootBeneficiaryUid: string | null = null

  if (ROOT_BENEFICIARY_EMAIL) {
    const rootUser = await findUserByEmail(db, ROOT_BENEFICIARY_EMAIL)
    rootBeneficiaryUid = rootUser?.uid ?? null
  } else if (users.length > 0) {
    const deepestUser = users[users.length - 1]
    const expected = await buildExpectedReferralUpline(db, deepestUser.uid, deepestUser.profile)
    rootBeneficiaryUid = expected[expected.length - 1] ?? null
  }

  if (rootBeneficiaryUid) {
    await printRootBeneficiaryRewards(
      db,
      rootBeneficiaryUid,
      users.map((user) => user.uid),
    )
  }

  console.log('\n=== Corrección referralUpline ===')

  for (const user of users) {
    await repairReferralUplineIfNeeded(db, user)
  }

  if (REGENERATE_REWARDS) {
    console.log('\n=== Regeneración rewards faltantes ===')

    for (const user of users) {
      await regenerateMissingRewardsForUser(db, user)
    }

    if (rootBeneficiaryUid) {
      await printRootBeneficiaryRewards(
        db,
        rootBeneficiaryUid,
        users.map((user) => user.uid),
      )
    }
  } else {
    console.log(
      '\n[INFO] Para regenerar rewards faltantes: REGENERATE_REWARDS=true APPLY=true npm run audit:referral-chain',
    )
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.'
  fail(message)
})
