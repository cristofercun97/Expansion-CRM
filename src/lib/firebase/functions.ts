import { getFunctions, type Functions } from 'firebase/functions'
import { getFirebaseApp } from '@/lib/firebase/client'

const FUNCTIONS_REGION = 'europe-west1'

let functionsInstance: Functions | undefined

export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(getFirebaseApp(), FUNCTIONS_REGION)
  }

  return functionsInstance
}

export const FIREBASE_FUNCTIONS_REGION = FUNCTIONS_REGION
