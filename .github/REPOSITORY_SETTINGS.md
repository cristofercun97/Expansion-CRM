# GitHub repository settings (manual)

If `gh` CLI is not installed, apply these in GitHub → **Settings** → **General**:

**Description**
```
CRM web para líderes y miembros — React, TypeScript, Firebase (Academia, contactos, presentaciones, radar).
```

**Topics** (add in the repo home → ⚙️ → Topics)
```
react
typescript
firebase
firestore
crm
vite
tailwindcss
```

**Website** (optional, after deploy)
```
https://expansion-proyect.web.app
```

Or with GitHub CLI:
```bash
gh repo edit cristofercun97/Expansion-CRM \
  --description "CRM web para líderes y miembros — React, TypeScript, Firebase." \
  --add-topic react --add-topic typescript --add-topic firebase \
  --add-topic firestore --add-topic crm --add-topic vite --add-topic tailwindcss
```
