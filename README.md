# Expansion-CRM

CRM web app for team leaders and members — React, TypeScript, Tailwind CSS, and Firebase.

## Stack

- React 19 + Vite + TypeScript
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS

## Setup

```bash
npm install
cp .env.example .env
# Fill in Firebase config in .env
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run firebase:deploy-rules` | Deploy Firestore rules |

## Environment

Copy `.env.example` to `.env` and add your Firebase project credentials. Never commit `.env` or service account keys.
