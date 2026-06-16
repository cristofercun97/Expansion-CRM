/**
 * Bootstrap local de cuenta administradora EXPANSIÓN.
 *
 * SECURITY:
 * - Ejecutar solo en entorno local/controlado.
 * - Requiere serviceAccountKey.json o GOOGLE_APPLICATION_CREDENTIALS (nunca commitear).
 * - Requiere ADMIN_PASSWORD en entorno (nunca hardcodear).
 * - No crea perfil operativo (leaders, landing, slugs, referralCodes).
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, cert, getApps, getApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || 'admin@expansion.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim()
const ADMIN_DISPLAY_NAME = 'Administrador Expansión'
const DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID?.trim() ||
  process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
  'default'

function fail(message: string): never {
  console.error(`[EXPANSIÓN admin:bootstrap] ${message}`)
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

async function ensureAdminAuthUser() {
  const auth = getAuth()

  try {
    const existingUser = await auth.getUserByEmail(ADMIN_EMAIL)

    await auth.updateUser(existingUser.uid, {
      emailVerified: true,
      disabled: false,
      displayName: ADMIN_DISPLAY_NAME,
      password: ADMIN_PASSWORD,
    })

    console.log(`[EXPANSIÓN admin:bootstrap] Usuario Auth actualizado: ${ADMIN_EMAIL}`)

    return existingUser.uid
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : ''

    if (errorCode !== 'auth/user-not-found') {
      throw error
    }
  }

  const createdUser = await auth.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_DISPLAY_NAME,
    emailVerified: true,
    disabled: false,
  })

  console.log(`[EXPANSIÓN admin:bootstrap] Usuario Auth creado: ${ADMIN_EMAIL}`)

  return createdUser.uid
}

async function upsertAdminFirestoreUser(uid: string): Promise<void> {
  const db = getFirestore(getApp(), DATABASE_ID)
  const userRef = db.collection('users').doc(uid)
  const snapshot = await userRef.get()

  const adminProfile = {
    uid,
    email: ADMIN_EMAIL,
    displayName: ADMIN_DISPLAY_NAME,
    phone: '',
    photoURL: '',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (snapshot.exists) {
    await userRef.update(adminProfile)
    console.log(`[EXPANSIÓN admin:bootstrap] Firestore users/${uid} actualizado como admin.`)
    return
  }

  await userRef.set({
    ...adminProfile,
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log(`[EXPANSIÓN admin:bootstrap] Firestore users/${uid} creado como admin.`)
}

async function main() {
  if (!ADMIN_PASSWORD) {
    fail(
      'ADMIN_PASSWORD es obligatorio. Ejemplo: ADMIN_EMAIL=admin@expansion.com ADMIN_PASSWORD="TU_PASSWORD_SEGURA" npm run admin:bootstrap',
    )
  }

  if (ADMIN_PASSWORD.length < 8) {
    fail('ADMIN_PASSWORD debe tener al menos 8 caracteres.')
  }

  initFirebaseAdmin()

  console.log(`[EXPANSIÓN admin:bootstrap] Firestore databaseId: ${DATABASE_ID}`)

  const uid = await ensureAdminAuthUser()
  await upsertAdminFirestoreUser(uid)

  console.log('[EXPANSIÓN admin:bootstrap] Bootstrap completado.')
  console.log(`[EXPANSIÓN admin:bootstrap] Inicia sesión en la app con ${ADMIN_EMAIL}.`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido.'
  fail(message)
})
