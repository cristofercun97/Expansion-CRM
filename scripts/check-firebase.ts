import { checkFirebaseConnection, getFirebaseEnvIssues } from '@/lib/firebase/diagnostics'

const result = checkFirebaseConnection()

if (!result.ready) {
  const missingKeys = getFirebaseEnvIssues()
  if (missingKeys.length > 0) {
    console.error(
      `[EXPANSIÓN Firebase] Variables faltantes o vacías: ${missingKeys.join(', ')}`,
    )
  }
}

console.log(JSON.stringify(result, null, 2))

process.exit(result.ready ? 0 : 1)
