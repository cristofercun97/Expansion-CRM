/**
 * Migra referralRewards de status "pending" → "payable" para el flujo de solicitud de pago.
 *
 * Uso:
 *   npm run migrate:referral-rewards-payable
 *   APPLY=true npm run migrate:referral-rewards-payable
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

type MigrationSummary = {
  reviewed: number
  eligible: number
  migrated: number
  skipped: number
  errors: number
}

function fail(message: string): never {
  console.error(`[EXPANSIÓN migrate:referral-rewards-payable] ${message}`)
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

function isEligiblePendingReward(rewardId: string, data: DocumentData): boolean {
  if (data.status !== 'pending') {
    return false
  }

  if (data.source !== 'group_activation') {
    return false
  }

  if (data.currency !== 'EUR') {
    return false
  }

  if (typeof data.amount !== 'number' || data.amount <= 0) {
    return false
  }

  if (!readNonEmptyUid(data.activatedUserUid)) {
    return false
  }

  if (!readNonEmptyUid(data.beneficiaryUid)) {
    return false
  }

  if (typeof data.rewardId === 'string' && data.rewardId !== rewardId) {
    return false
  }

  return true
}

async function main(): Promise<void> {
  initFirebaseAdmin()

  const db = getFirestore(getApp(), DATABASE_ID)
  const summary: MigrationSummary = {
    reviewed: 0,
    eligible: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  }

  console.log(`[EXPANSIÓN migrate:referral-rewards-payable] databaseId: ${DATABASE_ID}`)
  console.log(`[EXPANSIÓN migrate:referral-rewards-payable] APPLY=${APPLY}`)

  const snapshot = await db.collection('referralRewards').where('status', '==', 'pending').get()

  if (snapshot.empty) {
    console.log('[EXPANSIÓN migrate:referral-rewards-payable] No hay rewards con status pending.')
    return
  }

  for (const rewardDoc of snapshot.docs) {
    summary.reviewed += 1
    const rewardId = rewardDoc.id
    const data = rewardDoc.data()

    if (!isEligiblePendingReward(rewardId, data)) {
      summary.skipped += 1
      console.log(`[SKIP] ${rewardId}: no cumple criterios de migración`)
      continue
    }

    summary.eligible += 1

    console.log(
      [
        `[${APPLY ? 'APPLY' : 'DRY RUN'}] ${rewardId}`,
        `activatedUserUid=${data.activatedUserUid}`,
        `beneficiaryUid=${data.beneficiaryUid}`,
        `level=${data.level}`,
        `amount=${data.amount}`,
        `status actual=pending`,
        `status esperado=payable`,
      ].join(' | '),
    )

    if (!APPLY) {
      continue
    }

    try {
      await db.collection('referralRewards').doc(rewardId).set(
        {
          status: 'payable',
          payableAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          migratedToPayableAt: FieldValue.serverTimestamp(),
          migrationReason: 'activation_reward_user_request_flow',
        },
        { merge: true },
      )

      summary.migrated += 1
    } catch (error) {
      summary.errors += 1
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error(`[ERROR] ${rewardId}: ${message}`)
    }
  }

  console.log('[EXPANSIÓN migrate:referral-rewards-payable] Resumen:')
  console.log(`  Revisadas (pending): ${summary.reviewed}`)
  console.log(`  Elegibles: ${summary.eligible}`)
  console.log(`  Migradas: ${summary.migrated}`)
  console.log(`  Omitidas: ${summary.skipped}`)
  console.log(`  Errores: ${summary.errors}`)

  if (summary.errors > 0) {
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.'
  fail(message)
})
