# PROJECT_FIT — Tests

## Logique métier (packages/shared) — exécutable
```bash
cd packages/shared && npm test    # 25 tests (node --test via tsx)
npx tsc --noEmit                  # typecheck strict
```
Couvre : e1RM/volume/force relative, progression déterministe, détection de records,
validation onboarding, niveaux/XP/streak, calcul de rang + anti-cheat.

## Base de données & sécurité (RLS) — exécutable
```bash
PGHOST=/tmp PGPORT=5433 bash backend/supabase/validate_local.sh
```
Applique migrations + seed sur un Postgres jetable, vérifie l'intégrité (52 exercices),
et les tests d'isolation RLS (un utilisateur ne voit/écrit que ses données ; écriture
directe leaderboard/subscriptions refusée).

## Services mobiles — typecheck
Chaque service (`auth`, `onboarding`, `exercises`, `workouts`, `progress`,
`gamification`, `ranking`, `subscription`, `ai`, `analytics`) est typechecké contre
les SDK réels (Supabase v2, TanStack Query, zustand).

## À compléter (non fait, honnêteté)
- Tests E2E de l'app (Detox/Maestro) sur un device/simulateur.
- Tests d'intégration des Edge Functions (Deno) contre un projet Supabase de test.
- Test réel du flux d'achat RevenueCat en sandbox Apple/Google.
Ces étapes nécessitent des builds natifs et des comptes stores.
