# Expansion-CRM

[![CI](https://github.com/cristofercun97/Expansion-CRM/actions/workflows/ci.yml/badge.svg)](https://github.com/cristofercun97/Expansion-CRM/actions/workflows/ci.yml)

CRM web para líderes de equipo y miembros — gestión de contactos, academia, presentaciones, radar y plan de acción.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · Firebase

## Módulos

- **Academia** — materiales, tests y seguimiento de progreso por miembro
- **Contactos** — pipeline de prospectos y clientes
- **Presentación** — landing personalizada por líder
- **Radar** — métricas del equipo
- **Plan de acción** — tareas y seguimiento
- **Mi grupo** — invitaciones y activación de miembros

## Requisitos

- Node.js 20+
- Proyecto Firebase (Auth, Firestore, Storage)

## Setup local

```bash
npm install
cp .env.example .env
# Completa las variables Firebase en .env
npm run dev
```

La app corre en `http://localhost:5173`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run preview` | Preview del build |
| `npm run firebase:deploy-rules` | Desplegar reglas Firestore |
| `npm run admin:bootstrap` | Bootstrap de usuario admin |

## Variables de entorno

Copia `.env.example` → `.env`. **Nunca** subas `.env` ni `serviceAccountKey.json`.

## Despliegue Firebase

```bash
npm run firebase:deploy-rules
firebase deploy   # hosting / functions si aplica
```

## CI

Cada push a `main` y cada PR ejecutan `npm run build` vía GitHub Actions.

## Topics

`react` · `typescript` · `firebase` · `crm` · `vite` · `tailwindcss` · `firestore`

## Licencia

Proyecto privado — uso interno.
