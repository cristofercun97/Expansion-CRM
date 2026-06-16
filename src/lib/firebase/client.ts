import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseConfig, firebaseDatabaseId, validateFirebaseEnv } from './config'

const FIREBASE_LOG_PREFIX = '[EXPANSIÓN Firebase]'

const envValidation = validateFirebaseEnv()

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

if (envValidation.isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  db = getFirestore(app, firebaseDatabaseId)
  storage = getStorage(app)
} else {
  console.error(
    `${FIREBASE_LOG_PREFIX} Configuración incompleta. Variables faltantes: ${envValidation.missingKeys.join(', ')}.`,
  )
  console.error(
    `${FIREBASE_LOG_PREFIX} Copia .env.example a .env y completa tus credenciales de Firebase Console.`,
  )
}

export function assertFirebaseReady(): void {
  if (!envValidation.isConfigured || !app || !auth || !db || !storage) {
    throw new Error(
      `${FIREBASE_LOG_PREFIX} Firebase no está inicializado. Variables faltantes: ${envValidation.missingKeys.join(', ')}.`,
    )
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertFirebaseReady()
  return app!
}

export function getFirebaseAuth(): Auth {
  assertFirebaseReady()
  return auth!
}

export function getFirebaseDb(): Firestore {
  assertFirebaseReady()
  return db!
}

export function getFirebaseStorage(): FirebaseStorage {
  assertFirebaseReady()
  return storage!
}

export { app, auth, db, storage, envValidation as firebaseEnvValidation }
