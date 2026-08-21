# PROJECT_FIT — Base de données (Phase 4)

Postgres 16 / Supabase. Schéma versionné dans `backend/supabase/migrations/`,
données de référence dans `backend/supabase/seed/`.

## Migrations
- `0001_init_schema.sql` — tables, enums, contraintes CHECK, index, triggers `updated_at`.
- `0002_rls_policies.sql` — Row Level Security + vue publique `public_leaderboard`.

## Modèle (résumé)
Voir `docs/PHASE_0_ANALYSIS.md` section C. Domaines : identité/profil, catalogue
exercices (contenu global), programmes, séances & tracking, records, IA, gamification,
ranking, abonnements, challenges, notifications.

## Principes RLS
- **Contenu global** (exercises, muscles, equipment, programs, ranks, thresholds,
  rules, achievements, challenges) : lecture pour `authenticated`, écriture `is_admin()`.
- **Données utilisateur** : accès restreint à `user_id = auth.uid()` (SELECT/INSERT/UPDATE/DELETE).
  Tables indirectes (`workout_exercises`, `sets`) filtrées via le parent `workouts`.
- **Leaderboard** : lecture des entrées `verified` ; **aucune écriture client** — les
  Edge Functions (`service_role`, bypass RLS) écrivent après anti-cheat. Vue
  `public_leaderboard` = uniquement les champs publics.
- **Subscriptions** : l'utilisateur **lit** son statut, n'écrit jamais (webhooks serveur only).

## Seed
- `seed/0001_seed_core.sql` — levels, ranks, rank_thresholds (défaut global force
  relative, par sexe), ranking_rules, equipment, muscles.
- `seed/0002_seed_exercises.sql` — **52 exercices** (auto-généré) avec nom, description,
  muscle principal + secondaires, équipement, niveau, difficulté, instructions,
  erreurs fréquentes, variantes. Architecture prête pour en ajouter des centaines.

## Validation locale (reproductible)
`backend/supabase/validate_local.sh` applique migrations + seed sur une base jetable
en stubbant `auth`, `auth.uid()` et les rôles Supabase (`authenticated`/`anon`/`service_role`).
**Résultats vérifiés dans cette phase :**
- Migrations + RLS + seed : appliqués sans erreur.
- Seed idempotent (re-run → 52 exercices, pas de doublon).
- Intégrité : 52 exercices (tous avec muscle principal), 68 liens équipement,
  127 liens muscles, 67 variantes, 0 variante orpheline.
- **Tests RLS (2 utilisateurs)** : un user ne peut pas usurper le `user_id` d'un
  autre (INSERT bloqué), ne voit pas ses données (SELECT=0), ne peut pas les
  modifier (UPDATE 0 lignes), et l'écriture directe de `leaderboard_entries` /
  `subscriptions` est refusée côté client.

> Note : ce harness reproduit les objets Supabase pour la CI locale. Sur le vrai
> projet Supabase, `auth`, `auth.uid()` et les rôles existent déjà — appliquer
> uniquement les fichiers `migrations/` et `seed/` via `supabase db push` / CLI.
