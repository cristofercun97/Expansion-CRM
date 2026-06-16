export { firebaseConfig, validateFirebaseEnv } from './config'
export { COLLECTIONS } from './collections'
export type { CollectionName } from './collections'
export {
  app,
  auth,
  db,
  storage,
  assertFirebaseReady,
  firebaseEnvValidation,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from './client'
export {
  checkFirebaseConnection,
  getFirebaseEnvIssues,
} from './diagnostics'
export type { FirebaseConnectionDiagnostics } from './diagnostics'
