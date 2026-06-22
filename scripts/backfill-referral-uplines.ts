/**
 * Backfill local: crea users/{uid}.referralUpline para cuentas legacy sin cadena canónica.
 *
 * SECURITY:
 * - Ejecutar solo en entorno local/controlado con credenciales de servicio.
 * - Requiere serviceAccountKey.json o GOOGLE_APPLICATION_CREDENTIALS (nunca commitear).
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert, getApps, getApp, type ServiceAccount } from 'firebase-admin/app'
import { FieldValue, getFirestore, type DocumentData } from 'firebase-admin/firestore'

const DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID?.trim() ||
  process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
  'default'

const DRY_RUN = process.env.BACKFILL_DRY_RUN === 'true'

const MAX_REFERRAL_LEVELS = 3
const FIREBASE_UID_PATTERN = /^[a-zA-Z0-9]{20,128}$/

type BackfillSummary = {
  usersReviewed: number
  chainsCreated: number
  usersWithoutChain: number
  alreadyHadChain: number
  errors: number
}

function fail(message: string): never {
  console.error(`[EXPANSIÓN backfill:referral-uplines] ${message}`)
  process.exit(1)
}

function loadServiceAccount(): ServiceAccount {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()

  if (credentialsPath) {
    if (!existsSync(credentialsPath)) {
      fail(
        `GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo inexistente: ${credentialsPath}`,
      )
    }

    return JSON.parse(readFileSync(credentialsPath, 'utf8')) as ServiceAccount
  }

  const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json')

  if (existsSync(localKeyPath)) {
    return JSON.parse(readFileSync(localKeyPath, 'utf8')) as ServiceAccount
  }

  fail(
    'No se encontró credencial de servicio. Coloca serviceAccountKey.json en la raíz del proyecto o define GOOGLE_APPLICATION_CREDENTIALS.',
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

function readUidFromRecord(data: DocumentData, keys: string[]): string | null {
  for (const key of keys) {
    const uid = readNonEmptyUid(data[key])

    if (uid) {
      return uid
    }
  }

  return null
}

async function getUserData(db: FirebaseFirestore.Firestore, uid: string): Promise<DocumentData | null> {
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

  const referrerUid = readUidFromRecord(profile, [
    'invitedBy',
    'referredBy',
    'sponsorUid',
    'parentUid',
    'leaderId',
  ])

  if (!referrerUid || referrerUid === uid) {
    return null
  }

  return referrerUid
}

async function buildReferralUplineFromLegacyFallback(
  db: FirebaseFirestore.Firestore,
  uid: string,
  profile: DocumentData,
): Promise<string[]> {
  const homeTeamId = readNonEmptyUid(profile.homeTeamId) ?? ''
  const chain: string[] = []
  const seen = new Set<string>([uid])

  let nextReferrerUid =
    readUidFromRecord(profile, ['invitedBy', 'referredBy', 'sponsorUid', 'parentUid', 'leaderId']) ??
    null

  if ((!nextReferrerUid || nextReferrerUid === uid) && homeTeamId) {
    const memberSnapshot = await db.collection('teamMembers').doc(`${homeTeamId}_${uid}`).get()

    if (memberSnapshot.exists) {
      const memberData = memberSnapshot.data() ?? {}
      nextReferrerUid =
        readUidFromRecord(memberData, ['invitedByUid', 'sponsorUid', 'parentUid']) ??
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

async function main(): Promise<void> {
  initFirebaseAdmin()

  const db = getFirestore(getApp(), DATABASE_ID)
  const summary: BackfillSummary = {
    usersReviewed: 0,
    chainsCreated: 0,
    usersWithoutChain: 0,
    alreadyHadChain: 0,
    errors: 0,
  }

  console.log(`[EXPANSIÓN backfill:referral-uplines] Firestore databaseId: ${DATABASE_ID}`)

  if (DRY_RUN) {
    console.log('[EXPANSIÓN backfill:referral-uplines] Modo DRY RUN activo (BACKFILL_DRY_RUN=true)')
  }

  const usersSnapshot = await db.collection('users').get()

  for (const userDoc of usersSnapshot.docs) {
    summary.usersReviewed += 1
    const uid = userDoc.id
    const profile = userDoc.data()
    const existingChain = normalizeReferralUpline(profile.referralUpline, uid)

    if (existingChain.length > 0) {
      summary.alreadyHadChain += 1
      continue
    }

    try {
      const fallbackChain = await buildReferralUplineFromLegacyFallback(db, uid, profile)

      if (fallbackChain.length === 0) {
        summary.usersWithoutChain += 1
        continue
      }

      if (DRY_RUN) {
        console.log(
          `[EXPANSIÓN backfill:referral-uplines] [DRY RUN] Crearía referralUpline para users/${uid}: ${fallbackChain.join(' -> ')}`,
        )
        summary.chainsCreated += 1
        continue
      }

      await db.collection('users').doc(uid).set(
        {
          referralUpline: fallbackChain,
          referralUplineSource: 'backfill',
          referralUplineUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )

      summary.chainsCreated += 1
      console.log(
        `[EXPANSIÓN backfill:referral-uplines] referralUpline creada para users/${uid}: ${fallbackChain.join(' -> ')}`,
      )
    } catch (error) {
      summary.errors += 1
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error(`[EXPANSIÓN backfill:referral-uplines] Error en users/${uid}: ${message}`)
    }
  }

  console.log('[EXPANSIÓN backfill:referral-uplines] Resumen:')
  console.log(`  Usuarios revisados: ${summary.usersReviewed}`)
  console.log(`  Cadenas creadas: ${summary.chainsCreated}`)
  console.log(`  Usuarios que ya tenían cadena: ${summary.alreadyHadChain}`)
  console.log(`  Usuarios sin cadena detectable: ${summary.usersWithoutChain}`)
  console.log(`  Errores: ${summary.errors}`)

  if (summary.errors > 0) {
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.'
  fail(message)
})
