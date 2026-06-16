import { env, validateFirebaseEnv } from '@/config/env'

export const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
} as const

export const firebaseDatabaseId = env.firebase.databaseId

export { validateFirebaseEnv }
