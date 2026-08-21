# PROJECT_FIT — Architecture

Vue détaillée dans `docs/PHASE_0_ANALYSIS.md`. Résumé opérationnel :

```
Mobile (Expo/RN/TS)  ──JWT──►  Supabase (Postgres + Auth + Storage + Edge Functions)
   Expo Router                    │  RLS par utilisateur
   TanStack Query (cache/offline)  ├─ Edge: ai-recommendation (Anthropic, quotas)
   Zustand (session/onboarding)    ├─ Edge: leaderboard-submit (anti-cheat)
   packages/shared (logique pure)  ├─ Edge: revenuecat-webhook (statut Premium)
                                   └─ Edge: account-delete (RGPD)
RevenueCat ─ webhook ─► subscriptions   |   PostHog (analytics)   |   Expo Push
```

## Couches
- **packages/shared** : logique pure testée (e1RM, progression, records, gamification,
  ranking, validation onboarding). 25 tests. Aucune dépendance framework.
- **apps/mobile/src/services** : accès données (Supabase) + wrappers (purchases, analytics,
  notifications). Typecheckés contre les SDK réels.
- **apps/mobile/app** : écrans (Expo Router file-based).
- **backend/supabase** : migrations SQL versionnées + seed + Edge Functions.

## Principe de sécurité
Le client ne se fait jamais confiance : Premium, ranking, IA et suppression de compte
sont calculés/validés côté serveur (RLS + Edge Functions).
