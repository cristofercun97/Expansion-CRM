/**
 * Backfill local: denormaliza ownedTeamId + activationStatus en teamMembers del homeTeam.
 *
 * Caso: usuarios activados antes del patch de aprobación que no tienen esos campos
 * en teamMembers/{homeTeamId}_{uid}.
 *
 * SECURITY:
 * - Ejecutar solo en entorno local/controlado con credenciales de servicio.
 * - Requiere serviceAccountKey.json o GOOGLE_APPLICATION_CREDENTIALS (nunca commitear).
 * - No expone lógica en frontend; usa Firebase Admin SDK.
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

type ActiveUserRecord = {
  uid: string
  homeTeamId: string
  ownedTeamId: string
  email?: string
  displayName?: string
}

type BackfillSummary = {
  activeUsersFound: number
  teamMembersUpdated: number
  teamMembersAlreadySynced: number
  teamMembersNotFound: number
  errors: number
}

function fail(message: string): never {
  console.error(`[EXPANSIÓN backfill:team-member-leaders] ${message}`)
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

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapActiveUser(uid: string, data: DocumentData): ActiveUserRecord | null {
  const homeTeamId = readNonEmptyString(data.homeTeamId)
  const ownedTeamId = readNonEmptyString(data.ownedTeamId)
  const activationStatus = readNonEmptyString(data.activationStatus)

  if (activationStatus !== 'active' || !homeTeamId || !ownedTeamId) {
    return null
  }

  return {
    uid,
    homeTeamId,
    ownedTeamId,
    email: readNonEmptyString(data.email) ?? undefined,
    displayName: readNonEmptyString(data.displayName) ?? undefined,
  }
}

function isAlreadySynced(data: DocumentData, ownedTeamId: string): boolean {
  const existingOwnedTeamId = readNonEmptyString(data.ownedTeamId)
  const existingActivationStatus = readNonEmptyString(data.activationStatus)

  return existingOwnedTeamId === ownedTeamId && existingActivationStatus === 'active'
}

async function fetchActiveUsersWithOwnedOrganization(): Promise<ActiveUserRecord[]> {
  const db = getFirestore(getApp(), DATABASE_ID)
  const snapshot = await db.collection('users').where('activationStatus', '==', 'active').get()

  return snapshot.docs
    .map((userDoc) => mapActiveUser(userDoc.id, userDoc.data()))
    .filter((user): user is ActiveUserRecord => user !== null)
}

async function backfillTeamMemberLeaderFields(user: ActiveUserRecord): Promise<
  'updated' | 'already_synced' | 'not_found' | 'error'
> {
  const db = getFirestore(getApp(), DATABASE_ID)
  const memberDocId = `${user.homeTeamId}_${user.uid}`
  const memberRef = db.collection('teamMembers').doc(memberDocId)
  const memberSnapshot = await memberRef.get()

  if (!memberSnapshot.exists) {
    console.warn(
      `[EXPANSIÓN backfill:team-member-leaders] No existe teamMember para este usuario en su homeTeam: users/${user.uid} → teamMembers/${memberDocId}`,
    )
    return 'not_found'
  }

  const memberData = memberSnapshot.data() ?? {}

  if (isAlreadySynced(memberData, user.ownedTeamId)) {
    return 'already_synced'
  }

  if (DRY_RUN) {
    console.log(
      `[EXPANSIÓN backfill:team-member-leaders] [DRY RUN] Actualizaría teamMembers/${memberDocId} con ownedTeamId=${user.ownedTeamId}`,
    )
    return 'updated'
  }

  await memberRef.set(
    {
      ownedTeamId: user.ownedTeamId,
      activationStatus: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log(
    `[EXPANSIÓN backfill:team-member-leaders] Actualizado teamMembers/${memberDocId} (${user.displayName || user.email || user.uid})`,
  )

  return 'updated'
}

async function main(): Promise<void> {
  initFirebaseAdmin()

  console.log(`[EXPANSIÓN backfill:team-member-leaders] Firestore databaseId: ${DATABASE_ID}`)

  if (DRY_RUN) {
    console.log('[EXPANSIÓN backfill:team-member-leaders] Modo DRY RUN activo (BACKFILL_DRY_RUN=true)')
  }

  const activeUsers = await fetchActiveUsersWithOwnedOrganization()
  const summary: BackfillSummary = {
    activeUsersFound: activeUsers.length,
    teamMembersUpdated: 0,
    teamMembersAlreadySynced: 0,
    teamMembersNotFound: 0,
    errors: 0,
  }

  for (const user of activeUsers) {
    try {
      const result = await backfillTeamMemberLeaderFields(user)

      if (result === 'updated') {
        summary.teamMembersUpdated += 1
      } else if (result === 'already_synced') {
        summary.teamMembersAlreadySynced += 1
      } else if (result === 'not_found') {
        summary.teamMembersNotFound += 1
      }
    } catch (error) {
      summary.errors += 1
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error(
        `[EXPANSIÓN backfill:team-member-leaders] Error procesando users/${user.uid}: ${message}`,
      )
    }
  }

  console.log('[EXPANSIÓN backfill:team-member-leaders] Resumen:')
  console.log(`  Usuarios activos encontrados: ${summary.activeUsersFound}`)
  console.log(`  teamMembers actualizados: ${summary.teamMembersUpdated}`)
  console.log(`  teamMembers ya sincronizados: ${summary.teamMembersAlreadySynced}`)
  console.log(`  teamMembers no encontrados: ${summary.teamMembersNotFound}`)
  console.log(`  Errores: ${summary.errors}`)

  if (summary.errors > 0) {
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.'
  fail(message)
})
