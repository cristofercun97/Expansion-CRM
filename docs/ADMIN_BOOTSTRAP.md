# Bootstrap de cuenta administradora (Firebase Admin SDK)

Este documento explica cómo crear o actualizar la cuenta `admin@expansion.com` **sin depender de verificación por email**, usando un script local con Firebase Admin SDK.

## Por qué usar este método

El correo `admin@expansion.com` es ficticio y no tiene bandeja real. El script:

1. Crea o actualiza el usuario en **Firebase Auth** con `emailVerified: true`.
2. Crea o actualiza `users/{uid}` en **Firestore** con `role: "admin"`.
3. No usa la UI de registro ni enlaces de confirmación.
4. No crea perfil operativo (`leaders`, `leaderLandingPages`, `referralCodes`, `slugs`).

## Requisitos

- Node.js y dependencias del proyecto instaladas (`npm install`).
- Acceso al proyecto Firebase `expansion-proyect`.
- Clave de cuenta de servicio descargada desde Firebase Console.

## Paso 1 — Generar clave de cuenta de servicio

1. Abre [Firebase Console](https://console.firebase.google.com/).
2. Selecciona el proyecto **expansion-proyect**.
3. Ve a **Project settings** (engranaje) → pestaña **Service accounts**.
4. Haz clic en **Generate new private key**.
5. Guarda el JSON descargado.

## Paso 2 — Colocar la clave en local (no subir a Git)

Guarda el archivo en la raíz del proyecto como:

```
serviceAccountKey.json
```

Alternativa: define la ruta con variable de entorno:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/absoluta/a/tu-clave.json"
```

## Paso 3 — Ejecutar el bootstrap

Desde la raíz del proyecto:

```bash
ADMIN_EMAIL=admin@expansion.com ADMIN_PASSWORD="TU_PASSWORD_SEGURA" npm run admin:bootstrap
```

Opcional — si tu Firestore usa database ID distinto:

```bash
FIREBASE_DATABASE_ID=default ADMIN_EMAIL=admin@expansion.com ADMIN_PASSWORD="TU_PASSWORD_SEGURA" npm run admin:bootstrap
```

## Paso 4 — Iniciar sesión en la app

1. Abre la app en `/login`.
2. Usa:
   - **Email:** `admin@expansion.com`
   - **Contraseña:** la definida en `ADMIN_PASSWORD`
3. Debes acceder al panel en `/admin`.

## Qué hace el script

| Paso | Acción |
|------|--------|
| Auth (nuevo) | Crea usuario con email verificado y contraseña |
| Auth (existente) | Marca `emailVerified: true`, habilita cuenta, actualiza contraseña si se pasa `ADMIN_PASSWORD` |
| Firestore | `users/{uid}` con `role: "admin"`, `status: "active"`, `emailVerified: true` |

## Advertencias de seguridad

- **No subas** `serviceAccountKey.json` ni archivos `*.service-account.json` a Git.
- **No compartas** la contraseña admin ni la clave de servicio.
- **No hardcodees** contraseñas en el código ni en el repositorio.
- Ejecuta este script **solo en entorno local o controlado** por el equipo.
- La clave de servicio otorga privilegios elevados sobre Firebase; trátala como secreto de producción.
- Este script no modifica reglas Firestore ni expone endpoints en el frontend.

## Documentación relacionada

- Asignación manual previa (legacy): [ADMIN_SETUP.md](./ADMIN_SETUP.md)
