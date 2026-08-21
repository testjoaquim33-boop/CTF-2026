# PROJECT_FIT

Application mobile de fitness/musculation (freemium + Premium) — iOS & Android.
Nom de code temporaire : **PROJECT_FIT** (renommable via `apps/mobile/app.config.ts`
et `apps/mobile/src/constants/branding.ts`).

## Statut
- ✅ Phase 0 — Analyse & architecture : `docs/PHASE_0_ANALYSIS.md`
- ✅ Phase 2 — Monorepo (workspaces, shared pkg testé)
- ✅ Phase 3 — Design System (tokens dark-first)
- ✅ Phase 4 — Base de données (schéma, RLS testée, seed 52 exercices)
- ✅ Phase 5 — Authentification (services email/password + delete RGPD)
- 🚧 Phase 6 — Onboarding (9 écrans + persistance Supabase)

## Structure (monorepo)
```
apps/mobile      # App Expo (React Native + TypeScript)
apps/admin       # Admin panel (Next.js, séparé — service_role serveur only)
backend/supabase # Migrations SQL, seed, Edge Functions
packages/shared  # Types + logique pure partagée (calc e1RM, formats)
docs/            # Documentation
```

## Prérequis
- Node.js 20+ (testé sur 22)
- npm 10+
- Expo CLI (via `npx expo`)
- Compte Expo (EAS), Supabase, RevenueCat (voir `docs/`)

## Démarrage rapide
```bash
npm install                 # installe tous les workspaces
cp .env.example apps/mobile/.env   # puis remplir les valeurs (non secrètes)
npm run dev -w apps/mobile  # lance l'app Expo
```

## Sécurité
- Ne jamais committer `.env`, clés API, secrets, private keys.
- Les secrets (IA, RevenueCat service, service_role) vivent uniquement côté serveur.
- Voir `docs/SECURITY.md`.

## Documentation
Voir le dossier `docs/` : `PHASE_0_ANALYSIS.md` (architecture complète), puis
`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `DEPLOYMENT.md`,
`APP_STORE.md`, `GOOGLE_PLAY.md`, `AI.md`, `MONETIZATION.md` (ajoutés au fil des phases).
