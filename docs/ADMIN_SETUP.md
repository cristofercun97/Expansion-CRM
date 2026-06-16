# Configuración de cuenta administradora

Este documento explica cómo habilitar la cuenta administradora `admin@expansion.com` en EXPANSIÓN.

## Importante

- **No** se asigna rol `admin` automáticamente desde la interfaz de registro.
- **No** incluyas contraseñas ni credenciales en el código ni en este repositorio.
- El rol administrador se controla en Firestore (`users/{uid}.role = "admin"`).
- Antes de producción deben implementarse **Firestore Security Rules** que refuercen estos permisos en backend.

## Pasos para habilitar admin@expansion.com

### 1. Crear la cuenta

Opción A — Desde la app:

1. Ve a `/registro`.
2. Registra la cuenta con el correo `admin@expansion.com`.
3. Usa una contraseña segura y guárdala en un gestor de contraseñas.

Opción B — Desde Firebase Console:

1. Abre [Firebase Console](https://console.firebase.google.com/) → Authentication → Users.
2. Crea el usuario con email `admin@expansion.com`.

### 2. Confirmar el correo

1. Revisa la bandeja de entrada del correo admin.
2. Haz clic en el enlace de verificación enviado por Firebase.
3. Si no llega, inicia sesión en `/login` y usa `/verificar-email` para reenviar el correo.

### 3. Asignar rol admin en Firestore

1. Abre Firebase Console → Firestore Database.
2. Busca la colección `users`.
3. Localiza el documento cuyo `email` sea `admin@expansion.com` (el ID del documento es el `uid` de Auth).
4. Edita el documento y establece:

```json
{
  "role": "admin",
  "status": "active",
  "emailVerified": true
}
```

5. Guarda los cambios.

### 4. Verificar acceso

1. Cierra sesión si estabas autenticado con otra cuenta.
2. Inicia sesión con `admin@expansion.com`.
3. Debes ser redirigido a `/admin` (Panel de administración).
4. Un usuario normal con `role: "user"` **no** puede acceder a `/admin` (será redirigido a `/dashboard`).

## Script de referencia

Existe `scripts/bootstrap-admin.ts` como recordatorio del proceso manual. **No ejecuta cambios automáticos** ni contiene credenciales.

## Seguridad operativa

- No compartas las credenciales de administrador.
- Usa contraseñas únicas y MFA cuando esté disponible.
- Limita quién puede editar documentos en la colección `users`.
- Implementa reglas Firestore antes de lanzar a producción.

## Riesgos pendientes antes de producción

- Las reglas Firestore actuales no restringen escrituras de rol en cliente.
- El control de admin funciona en frontend, pero debe reforzarse en backend.
- No hay Cloud Functions para operaciones sensibles de administración.
