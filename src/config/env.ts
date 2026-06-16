const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number]

const readEnv = (key: FirebaseEnvKey): string => import.meta.env[key]?.trim() ?? ''

const readOptionalEnv = (key: string, fallback: string): string => {
  const value = import.meta.env[key]?.trim()
  return value || fallback
}

export const env = {
  firebase: {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
    databaseId: readOptionalEnv('VITE_FIREBASE_DATABASE_ID', 'default'),
  },
} as const

export type FirebaseEnvValidation = {
  isConfigured: boolean
  missingKeys: FirebaseEnvKey[]
}

export function validateFirebaseEnv(): FirebaseEnvValidation {
  const missingKeys = FIREBASE_ENV_KEYS.filter((key) => !readEnv(key))

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  }
}
