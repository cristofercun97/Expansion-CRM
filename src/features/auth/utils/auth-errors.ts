const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'Este correo ya está registrado. Inicia sesión o usa otro correo.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos. Verifica tus datos.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/network-request-failed':
    'No hay conexión a internet. Revisa tu red e intenta nuevamente.',
  'auth/too-many-requests':
    'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
  'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
  'auth/popup-blocked':
    'El navegador bloqueó la ventana emergente. Permite popups e intenta de nuevo.',
  'auth/account-exists-with-different-credential':
    'Este correo ya está registrado con otro método. Usa correo y contraseña.',
  'auth/cancelled-popup-request': 'Inicio de sesión cancelado.',
}

export function translateAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String(error.code)
    const message = AUTH_ERROR_MESSAGES[code]

    if (message) {
      return message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}
