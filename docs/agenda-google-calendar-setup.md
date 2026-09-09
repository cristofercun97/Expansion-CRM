# Google Calendar / Meet — configuración manual (Agenda Fase 1)

La Agenda funciona **sin** Google (reuniones internas).
Para Meet + Calendar automático debes completar esto:

## 1. Google Cloud Console

1. Abre el proyecto GCP vinculado a Firebase (`expansion-proyect`).
2. Activa **Google Calendar API**.
3. Crea credenciales OAuth 2.0 (tipo **Aplicación web**).
4. Añade redirect URI exacto:

```text
https://europe-west1-expansion-proyect.cloudfunctions.net/googleCalendarOAuthCallback
```

5. En OAuth Consent Screen, añade scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`

## 2. Firebase Functions secrets

```bash
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
firebase functions:secrets:set GOOGLE_OAUTH_REDIRECT_URI
# valor redirect = la URL de arriba

firebase functions:secrets:set APP_BASE_URL
# ejemplo: https://expansion-proyect.web.app
# o https://expansion-crm.com
```

## 3. Deploy

```bash
npm --prefix functions run build
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```

## Seguridad

- Los refresh tokens viven en `googleCalendarConnections/{uid}`.
- El cliente **no** puede leer ni escribir esa colección (reglas deniegan todo).
- Solo Cloud Functions (Admin SDK) gestionan tokens.

## OAuth state (anti-CSRF / anti-replay)

1. `getGoogleCalendarConnectUrl` crea un documento en `googleOAuthStates/{stateId}` con:
   - `uid` del usuario autenticado
   - `expiresAt` (15 minutos)
   - `used: false`
2. El `state` enviado a Google es un ID aleatorio de 32 bytes (hex), **no** el UID en claro.
3. `googleCalendarOAuthCallback` consume el state en una transacción:
   - rechaza si no existe, expiró o ya fue usado
   - marca `used: true` (un solo uso)
4. `googleOAuthStates` también está denegado al cliente en Firestore rules.

## Desconexión

`disconnectGoogleCalendar`:

1. intenta `revokeToken` en Google (best-effort)
2. elimina `googleCalendarConnections/{uid}`
3. **no** borra reuniones ni enlaces Meet históricos

La UI pide confirmación antes de desconectar.
