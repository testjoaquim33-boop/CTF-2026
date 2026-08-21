# PROJECT_FIT

Application mobile de fitness/musculation (freemium + Premium) — iOS & Android.
Nom de code temporaire : **PROJECT_FIT** (renommable via `apps/mobile/app.config.ts`
et `apps/mobile/src/constants/branding.ts`).

## Statut (MVP construit, à tester sur device)
- ✅ Phase 0 Analyse · 2 Monorepo · 3 Design System · 4 DB (RLS testée, 52 exercices)
- ✅ Phase 5 Auth · 6 Onboarding · 7 Bibliothèque exercices · 8-9 Séances + Tracking
- ✅ Phase 10-11 Progression + Records · 12 AI Coach · 13 Gamification · 14 Ranking
- ✅ Phase 15 Abonnements (RevenueCat) · 16 Notifications · 17 Analytics + Gym Card
- ✅ Docs sécurité/déploiement/store · logique partagée testée (25 tests)
- ⏳ À faire par toi : setup RevenueCat + comptes stores, tests sur device (voir docs/RUN.md)

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
