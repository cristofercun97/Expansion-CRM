import { firebaseConfig, firebaseDatabaseId, validateFirebaseEnv } from './config'
import { app, auth, db, storage } from './client'

export type FirebaseConnectionDiagnostics = {
  ready: boolean
  projectId?: string
  databaseId?: string
  services: {
    app: boolean
    auth: boolean
    firestore: boolean
    storage: boolean
  }
}

export function checkFirebaseConnection(): FirebaseConnectionDiagnostics {
  const validation = validateFirebaseEnv()

  const services = {
    app: Boolean(app),
    auth: Boolean(auth),
    firestore: Boolean(db),
    storage: Boolean(storage),
  }

  const ready =
    validation.isConfigured && Object.values(services).every((isReady) => isReady)

  return {
    ready,
    projectId: validation.isConfigured ? firebaseConfig.projectId : undefined,
    databaseId: validation.isConfigured ? firebaseDatabaseId : undefined,
    services,
  }
}

export function getFirebaseEnvIssues(): string[] {
  return validateFirebaseEnv().missingKeys
}
