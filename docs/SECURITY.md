# PROJECT_FIT — Sécurité

## Modèle de confiance
Le client ne se fait jamais confiance à lui-même. Tout ce qui est sensible passe
par le serveur (RLS Postgres + Edge Functions). Voir `docs/PHASE_0_ANALYSIS.md` (H).

## Secrets
| Secret | Où | Jamais |
|---|---|---|
| anon key, Supabase URL | `EXPO_PUBLIC_*` (client) | — (publiques, protégées par RLS) |
| service_role key | Edge Functions (auto) | app, .env mobile, Git |
| ANTHROPIC_API_KEY | `supabase secrets set` | app, Git, variable publique |
| REVENUECAT_WEBHOOK_SECRET | Edge Function | client |

`.gitignore` bloque `.env`, `*.key`, `*.p8`, `*.keystore`, `google-services.json`, etc.

## Auth & autorisation
- Supabase Auth (email/password d'abord ; Apple/Google câblés, activation documentée).
- **RLS** activée sur toutes les tables. Un utilisateur n'accède qu'à ses données.
  Vérifié par tests (2 utilisateurs) : usurpation de `user_id` bloquée, isolation
  SELECT/UPDATE/DELETE, écriture directe leaderboard/subscription refusée côté client.
- **Suppression de compte** (RGPD) : Edge Function `account-delete` identifie
  l'utilisateur par SON JWT (pas d'id dans le body → pas de suppression d'autrui),
  supprime les données publiques puis `auth.admin.deleteUser` → CASCADE.

## À venir (phases suivantes)
- Rate limiting + validation Zod sur les Edge Functions IA / leaderboard.
- Anti-cheat ranking (bornes, cohérence, multi-comptes).
- Contrôle des coûts IA (quotas Free/Premium, cache).
- Monitoring (Sentry) + audit (`ai_recommendations`, `subscription_events`).
