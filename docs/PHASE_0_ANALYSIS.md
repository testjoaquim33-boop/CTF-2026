# PROJECT_FIT — Phase 0 : Analyse & Architecture

> Document de référence. Nom de code temporaire : **PROJECT_FIT** (renommable via un
> seul fichier de config `app.config.ts` + `constants/branding.ts`).
> Statut : **Analyse — aucune ligne de code applicatif écrite.**
> Date : 2026-08-21.

Ce document couvre les points **A → O** demandés en Phase 0. Il fixe les décisions
d'architecture *avant* toute implémentation. Rien n'est codé tant qu'il n'est pas validé.

---

## A. Architecture complète (vue d'ensemble)

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                     │
│  App mobile (iOS + Android)  —  React Native + Expo + TypeScript   │
│  Admin Panel (web)           —  Next.js (séparé, jamais dans l'app)│
└───────────────┬───────────────────────────────┬──────────────────┘
                │ HTTPS (JWT Supabase)           │ HTTPS (admin, service role)
                ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Supabase)                             │
│  • PostgreSQL (données + RLS)                                      │
│  • Supabase Auth (email, Apple, Google)                           │
│  • Supabase Storage (vidéos/images exercices, gym cards)          │
│  • Edge Functions (Deno/TS) : logique sensible                    │
│       - /ai/recommendation   (proxy IA sécurisé, quotas)          │
│       - /leaderboard/submit   (anti-cheat, calcul score)          │
│       - /subscriptions/webhook (RevenueCat → statut Premium)      │
│       - /account/delete        (suppression/anonymisation RGPD)   │
└───────┬───────────────────┬───────────────────┬──────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ AI Service    │  │ RevenueCat       │  │ Push / Analytics     │
│ (Anthropic /  │  │ (Apple + Google  │  │ Expo Push +          │
│  OpenAI API)  │  │  abonnements)    │  │ PostHog / Amplitude  │
│ clé serveur   │  │ webhooks signés  │  │                      │
└───────────────┘  └──────────────────┘  └──────────────────────┘
```

**Principe directeur : le client ne fait jamais confiance à lui-même.**
Tout ce qui est sensible (statut Premium, score de ranking, appel IA, suppression
de compte) transite par une Edge Function ou par les webhooks serveur, jamais
calculé/validé côté mobile.

---

## B. Stack technique recommandée

| Couche | Choix recommandé | Pourquoi |
|---|---|---|
| **Mobile** | React Native + **Expo (SDK managed workflow)** + TypeScript | Un seul code iOS/Android, EAS Build/Submit, OTA updates. Conforme à ta demande. |
| **Navigation** | Expo Router (file-based) | Standard actuel Expo, deep-linking natif (utile pour viral loop / partage). |
| **State serveur** | **TanStack Query** (React Query) | Cache, retry, offline, invalidation — cœur du besoin "offline workouts". |
| **State client** | **Zustand** | Léger, simple, suffisant. Pas de Redux (surdimensionné). |
| **DB locale/offline** | **WatermelonDB** *ou* SQLite (expo-sqlite) + couche sync | Voir risque R2. Recommandation : commencer **op-based sync maison légère sur SQLite**, migrer si besoin. |
| **Backend** | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Conforme à ta demande, scale géré, RLS natif, Deno Edge Functions pour la logique sensible. |
| **Paiements** | **RevenueCat** | Standard de l'industrie pour abonnements mobiles Apple+Google. Ne PAS coder de validation maison. |
| **IA** | Proxy serveur → **Anthropic (Claude)** et/ou **OpenAI** | Clé uniquement côté Edge Function. Modèle "cheap" pour cas simples, "smart" pour génération de programme. |
| **Analytics** | **PostHog** (produit + funnels + feature flags) ou Amplitude | Funnels onboarding, rétention D1/D7/D30, A/B des paywalls. |
| **Push** | **Expo Notifications** (+ table `notifications`) | Intégré Expo, iOS+Android. |
| **Erreurs/monitoring** | **Sentry** (expo-sentry) | Crash + perf. |
| **Admin** | **Next.js** déployé séparément (Vercel), accès `service_role` côté serveur only | Jamais de privilèges admin dans l'app mobile. |
| **CI/CD** | EAS Build + GitHub Actions | Builds reproductibles dev/staging/prod. |

### Décision d'architecture importante (à valider) — RN/Expo vs Flutter
Je **recommande React Native + Expo** comme demandé : écosystème JS/TS partagé avec
le backend (Edge Functions en TS), RevenueCat + Supabase de première classe, EAS.
Flutter serait objectivement compétitif sur la perf d'animation pure, mais nous perdrions
le partage de types/logique avec le backend TS et l'intégration Expo. → **Je garde RN/Expo.**

### Décision — Supabase vs backend custom (Node/Nest)
**Supabase** pour le MVP : Auth + Postgres + RLS + Storage "prêts à l'emploi" divisent
le temps de dev par ~3. Le point de vigilance est la logique métier complexe (ranking,
anti-cheat, IA) → placée dans **Edge Functions**, pas dans le client. Si un jour la logique
dépasse ce que les Edge Functions offrent confortablement, on ajoute un service Node
dédié *derrière* la même auth. Architecture non bloquante.

---

## C. Schéma de base de données (modèle relationnel)

Convention : `snake_case`, PK `id uuid default gen_random_uuid()`, `created_at`,
`updated_at`. FK vers `auth.users(id)` de Supabase.

### Identité & profil
- **profiles** (`id` = auth.users.id, `display_name`, `avatar_url`, `sex`, `birth_year?`,
  `height_cm`, `unit_system` [metric|imperial], `created_at`) — 1:1 avec auth.users.
- **user_settings** (`user_id`, `locale`, `theme`, `notif_prefs jsonb`, `consent jsonb`,
  `analytics_opt_in bool`).
- **body_metrics** (`id`, `user_id`, `date`, `weight_kg`, `body_fat_pct?`) — historique poids.
- **goals** (`id`, `user_id`, `type` [weight_loss|muscle|strength|recomp|endurance|fitness],
  `target_weight_kg?`, `sessions_per_week`, `session_minutes`, `location`, `active bool`).

### Onboarding
- **onboarding_answers** (`user_id`, `objective`, `level`, `experience`, `sessions`,
  `duration`, `location`, `equipment text[]`, `completed_at`) — snapshot des réponses.

### Catalogue exercices (contenu, géré par admin)
- **equipment** (`id`, `slug`, `name`).
- **muscles** (`id`, `slug`, `name`, `group`).
- **exercises** (`id`, `slug`, `name`, `description`, `primary_muscle_id`, `level`,
  `video_url`, `image_url`, `instructions text[]`, `common_mistakes text[]`,
  `difficulty smallint`, `is_bodyweight bool`, `is_active bool`).
- **exercise_muscles** (`exercise_id`, `muscle_id`, `role` [primary|secondary]) — N:N.
- **exercise_equipment** (`exercise_id`, `equipment_id`) — N:N.
- **exercise_variants** (`exercise_id`, `variant_exercise_id`).

### Programmes (templates de contenu + instances utilisateur)
- **programs** (`id`, `slug`, `name`, `goal_type`, `level`, `weeks`, `is_premium bool`,
  `is_active bool`).
- **program_weeks** (`id`, `program_id`, `week_number`).
- **program_sessions** (`id`, `program_week_id`, `day_number`, `name`, `estimated_minutes`).
- **program_session_exercises** (`id`, `program_session_id`, `exercise_id`, `order`,
  `target_sets`, `target_reps_min`, `target_reps_max`, `target_rpe?`, `rest_seconds`).
- **user_programs** (`id`, `user_id`, `program_id?`, `source` [seed|ai|custom],
  `started_at`, `active bool`) — programme assigné/généré.

### Séances & tracking (données utilisateur)
- **workouts** (`id`, `user_id`, `user_program_id?`, `name`, `status`
  [planned|in_progress|completed|discarded], `started_at`, `completed_at`,
  `notes`, `client_uuid` unique) — `client_uuid` pour l'idempotence offline.
- **workout_exercises** (`id`, `workout_id`, `exercise_id`, `order`).
- **sets** (`id`, `workout_exercise_id`, `set_number`, `weight_kg`, `reps`,
  `rpe?`, `rest_seconds?`, `is_warmup bool`, `completed bool`, `logged_at`).

### Progression & records
- **personal_records** (`id`, `user_id`, `exercise_id`, `type`
  [est_1rm|max_weight|max_reps|max_volume], `value`, `unit`, `achieved_at`,
  `set_id?`) — 1 ligne par record battu (historique).
- **progress_metrics** (matérialisé/agrégé : `user_id`, `exercise_id?`, `metric`,
  `period`, `value`) — pour graphiques rapides (peut être une vue/materialized view).

### IA
- **ai_recommendations** (`id`, `user_id`, `type`, `input_hash`, `request jsonb`,
  `response jsonb`, `model`, `tokens`, `cost_usd`, `created_at`) — audit + cache.
- **ai_usage_quota** (`user_id`, `period_start`, `calls_used`, `tier`) — contrôle coûts.

### Gamification
- **levels** (`level`, `min_xp`, `title`) — seuils **en base**, configurables.
- **xp_events** (`id`, `user_id`, `type`, `xp`, `ref_id`, `created_at`).
- **user_stats** (`user_id`, `xp`, `level`, `streak_days`, `last_active_date`).
- **achievements** (`id`, `slug`, `name`, `description`, `icon`, `criteria jsonb`).
- **user_achievements** (`user_id`, `achievement_id`, `unlocked_at`).

### Ranking (Premium)
- **ranks** (`id`, `slug` [bronze..elite], `name`, `tier_order`, `color`).
- **rank_thresholds** (`id`, `exercise_id?`, `rank_id`, `sex`, `metric`
  [relative_strength|absolute|...], `min_value`, `max_value`) — **seuils en base**.
- **ranking_rules** (`id`, `exercise_id?`, `formula jsonb`, `params jsonb`) —
  formule configurable (ex: relative_strength = lift/bodyweight, cas pull-up/dips).
- **leaderboard_entries** (`id`, `user_id`, `exercise_id`, `best_score`,
  `best_e1rm`, `bodyweight_kg`, `rank_id`, `category` [poids/niveau/region],
  `region?`, `verified bool`, `updated_at`) — vue publique restreinte.

### Abonnements (source de vérité = webhooks RevenueCat)
- **subscriptions** (`user_id`, `status` [active|trial|grace|expired|cancelled],
  `product_id`, `store` [app_store|play_store], `entitlement`, `current_period_end`,
  `will_renew bool`, `rc_app_user_id`, `updated_at`).
- **subscription_events** (`id`, `user_id`, `event_type`, `payload jsonb`,
  `received_at`) — journal des webhooks (INITIAL_PURCHASE, RENEWAL, CANCELLATION…).

### Challenges (architecture prête, contenu minimal MVP)
- **challenges** (`id`, `slug`, `name`, `type`, `config jsonb`, `is_premium`,
  `starts_at`, `ends_at`, `is_active`).
- **challenge_participants** (`challenge_id`, `user_id`, `progress jsonb`,
  `joined_at`, `completed_at?`).

### Notifications & analytics
- **notifications** (`id`, `user_id`, `type`, `title`, `body`, `data jsonb`,
  `scheduled_for`, `sent_at?`, `read_at?`).
- **push_tokens** (`user_id`, `expo_token`, `platform`, `updated_at`).
- **analytics_events** — envoyés à PostHog/Amplitude, **pas** stockés massivement en
  Postgres (coût). Seuls les agrégats importants restent en base.

**Relations clés :** `sets → workout_exercises → workouts → user`,
`personal_records → exercise + user`, `leaderboard_entries → exercise + user`,
`rank_thresholds/ranking_rules` pilotent le calcul de rang (jamais dans le code mobile).

---

## D. Structure des dossiers (monorepo léger)

```
project_fit/
├── apps/
│   ├── mobile/                 # Expo app (React Native + TS)
│   │   ├── app/                # Expo Router (screens/routes)
│   │   │   ├── (onboarding)/
│   │   │   ├── (tabs)/         # home, workout, progress, ranking, profile
│   │   │   └── _layout.tsx
│   │   ├── src/
│   │   │   ├── components/     # UI atoms/molecules (design system)
│   │   │   ├── features/       # workout, ranking, ai, subscription... (vertical slices)
│   │   │   ├── hooks/
│   │   │   ├── services/       # supabase client, api wrappers, revenuecat
│   │   │   ├── store/          # zustand
│   │   │   ├── db/             # sqlite/watermelon + sync
│   │   │   ├── types/          # types partagés (générés depuis DB)
│   │   │   ├── constants/      # branding.ts (nom app centralisé)
│   │   │   ├── theme/          # design system tokens
│   │   │   └── utils/
│   │   ├── assets/
│   │   ├── app.config.ts       # nom, bundle id, icons — 1 seul endroit à changer
│   │   └── eas.json            # dev/staging/prod
│   └── admin/                  # Next.js admin (séparé, service_role serveur only)
├── backend/
│   └── supabase/
│       ├── migrations/         # schéma SQL versionné
│       ├── seed/               # 50+ exercices, ranks, levels
│       └── functions/          # edge functions (ai, leaderboard, webhooks, delete)
├── packages/
│   └── shared/                 # types + logique pure partagée (calc e1RM, formats)
├── docs/                       # README, ARCHITECTURE, DATABASE, API, SECURITY, AI...
├── .env.example
└── README.md
```

---

## E. Architecture IA (sécurisée)

```
App ──(JWT)──► Edge Function /ai/recommendation
                    │ 1. vérifie JWT (utilisateur authentifié)
                    │ 2. vérifie quota (ai_usage_quota, Free vs Premium)
                    │ 3. rate limit (par user + global)
                    │ 4. construit un prompt STRUCTURÉ à partir des SEULES données DB
                    │    (historique sets, PR, objectif, équipement) — pas d'invention
                    │ 5. cache : input_hash → réponse existante ? (ai_recommendations)
                    │ 6. choisit le modèle (cheap si cas simple, smart si programme)
                    ▼
              AI provider (clé serveur, jamais côté client)
                    │ 7. réponse forcée en JSON schema (validée : Zod côté function)
                    │ 8. garde-fous : pas de conseil médical, disclaimers ajoutés
                    ▼
              Retour validé ──► App (affichage)
```

**Règles fermes :**
- La clé API IA vit uniquement dans les secrets Supabase Edge Functions. Jamais dans
  l'app, GitHub, ou une variable publique `EXPO_PUBLIC_*`.
- Sortie contrainte à un **schéma JSON** (sets/reps/charge/repos). Toute sortie non
  conforme est rejetée → fallback déterministe (progression linéaire calculée).
- **Contrôle des coûts :** cache par `input_hash`, quotas (ex. Free = 3 recos/semaine,
  Premium = large), modèle éco par défaut, logging tokens+coût par appel.
- **Sécurité produit :** l'IA ne se présente jamais comme médecin, ne diagnostique pas.
  Détection de mots-clés douleur/blessure → message "consulte un professionnel de santé".
  Disclaimer permanent "ne remplace pas un avis médical".
- **Anti-hallucination :** le prompt n'autorise que des recommandations dérivées des
  données fournies. Progression de charge calculée par formule (e1RM Epley) et l'IA
  ne fait que l'habiller / l'ajuster, elle ne "devine" pas des chiffres.

---

## F. Architecture abonnement (RevenueCat)

```
App ── Purchase (StoreKit/Billing via RevenueCat SDK) ──► Apple/Google
                                                              │
RevenueCat ◄── reçu ── vérifie ── entitlement "premium" ─────┘
   │
   └── Webhook signé ──► Edge Function /subscriptions/webhook
                              │ vérifie signature
                              │ upsert subscriptions + subscription_events
                              ▼
                        Postgres = source de vérité du statut Premium
                              ▼
              App lit `subscriptions.status` (via RLS) → débloque Premium
```

- **Le statut Premium est déterminé côté serveur** (table `subscriptions` alimentée par
  webhooks), jamais uniquement par le SDK local.
- Offres : `monthly`, `yearly` (+ essai gratuit optionnel) définies **dans RevenueCat**
  (Offerings) → **changer prix/offres sans redéployer l'app**.
- Gère nativement via RevenueCat : purchase, **restore**, expiration, cancellation,
  grace period, upgrade/downgrade, renouvellement.
- **Actions manuelles requises de ta part** (documentées, non codables par moi) :
  créer les produits dans App Store Connect + Google Play Console, les lier dans
  RevenueCat, fournir les clés API RevenueCat. Je préparerai le code + la checklist.

---

## G. Architecture Ranking (configurable + anti-cheat)

```
Fin de séance ──► Edge Function /leaderboard/submit
   │ 1. auth + rate limit
   │ 2. ANTI-CHEAT : bornes plausibles (charge, reps), vitesse de progression,
   │    cohérence poids de corps, détection de valeurs absurdes / spam / multi-comptes
   │ 3. charge la ranking_rule de l'exercice (formule en base)
   │    - défaut : relative_strength = best_e1rm / bodyweight
   │    - pull-up/dips : (bodyweight + added_load)/bodyweight
   │ 4. calcule le score → compare rank_thresholds (par sexe, catégorie)
   │ 5. upsert leaderboard_entries (verified = résultat des checks)
   ▼
Leaderboards : global / par exercice / par niveau / par catégorie de poids /
région (V2) / mondial — exposés en LECTURE via vues publiques restreintes
(display_name + score + rank uniquement, jamais de données privées).
```

- Seuils (`rank_thresholds`) et formules (`ranking_rules`) **100 % en base**,
  modifiables sans toucher au code → amélioration future sans redéploiement.
- Ranks : Bronze → Silver → Gold → Platinum → Diamond → Elite, **par exercice**.
- Le classement utilise la **force relative** (et pas seulement l'absolu), comme demandé.

---

## H. Architecture sécurité

| Domaine | Mesure |
|---|---|
| **Auth** | Supabase Auth (email+password, Apple, Google), email verification, reset, logout. |
| **Authorization** | **RLS Postgres** : chaque table user-owned = policy `user_id = auth.uid()` pour SELECT/INSERT/UPDATE/DELETE. Contenu (exercices) lecture publique, écriture admin only. |
| **Leaderboards** | Vue publique exposant uniquement champs publics ; écriture via Edge Function (anti-cheat). |
| **Secrets** | Clés IA/RevenueCat/service_role uniquement en secrets serveur. `EXPO_PUBLIC_*` = seulement l'anon key + URL Supabase (non sensibles). |
| **API sensible** | Edge Functions (IA, leaderboard, webhook, delete) — jamais exposées directement au client. |
| **Rate limiting** | Par user + global sur IA et submit leaderboard. |
| **Validation** | Zod côté Edge Functions + contraintes SQL (CHECK) sur poids/reps. |
| **Anti-cheat** | Bornes, cohérence, détection multi-comptes, `verified` flag. Ne jamais croire le client. |
| **RGPD** | Consentement, minimisation, export, **delete account réel** (Edge Function : suppression/anonymisation en cascade). |
| **Monitoring** | Sentry (crash+perf) + logs Edge Functions + `subscription_events`/`ai_recommendations` audit. |
| **Delete account** | Bouton → Edge Function `service_role` : supprime workouts/sets/PR, anonymise leaderboard, révoque tokens, supprime auth.users. |

---

## I. MVP exact (périmètre figé)

**INCLUS (MVP) :** Auth (email/Apple/Google) · Onboarding 9 écrans · Profil · Bibliothèque
d'exercices (50+ seed) · Workout engine + Tracking (sets/reps/poids/repos + timer) ·
Progress (graphiques de base) · Personal Records (détection auto + animation) ·
**Basic AI Coach** (progression de charge + reco simple) · **Basic Ranking** (global +
par exercice, force relative) · Gamification de base (XP/niveau/streak/badges) ·
Premium + paywall · **Achats Apple + Google via RevenueCat** · Notifications (reminder,
streak, PR) · Analytics (events + funnels).

**EXCLUS du MVP (architecture préparée seulement) :** réseau social complet, chat,
marketplace, nutrition avancée, smartwatch/Apple Watch native, coaching humain,
communauté/messagerie, 300 challenges, ranking régional (V2), Health Connect/Apple
Health (V2).

---

## J. Roadmap de développement (phases → livrables)

| Phase | Contenu | Livrable |
|---|---|---|
| 1 | Architecture (ce doc) | validation |
| 2 | Init repo/monorepo, EAS, envs | app qui boot |
| 3 | Design System (tokens, composants) | Storybook/écran démo |
| 4 | Supabase : migrations + RLS + seed | DB + 50 exercices |
| 5 | Auth (email/Apple/Google, reset, delete) | login fonctionnel |
| 6 | Onboarding 9 écrans + persistance | profil créé |
| 7 | Exercise Library | liste + détail |
| 8 | Workout Engine | séance jouable |
| 9 | Tracking + timer + offline | séance loggée hors-ligne |
| 10 | Progress + graphiques | écran progression |
| 11 | Personal Records | détection + animation |
| 12 | AI Coach (Edge Function + proxy) | reco sécurisée |
| 13 | Gamification | XP/niveau/streak |
| 14 | Ranking + anti-cheat | leaderboards |
| 15 | Subscriptions (RevenueCat + webhook) | Premium débloqué serveur |
| 16 | Notifications | push configurables |
| 17 | Analytics | funnels |
| 18 | Security hardening | audit RLS/secrets |
| 19 | Tests (unit/integration/E2E) | CI verte |
| 20 | Builds prod iOS/Android | binaires EAS |
| 21 | App Store / Google Play | soumission |

---

## K. Complexité par module (estimation relative)

| Module | Complexité | Note |
|---|---|---|
| Design System | ●●○○○ | mécanique |
| Auth | ●●○○○ | Supabase gère l'essentiel (Apple Sign-In = config Apple) |
| Onboarding | ●●○○○ | UI + persistance |
| Exercise Library | ●●○○○ | contenu + seed |
| Workout Engine + Tracking | ●●●●○ | cœur produit, états, timer |
| **Offline / sync** | ●●●●● | **le plus risqué** (conflits) |
| Progress / graphiques | ●●●○○ | agrégations + charts |
| Personal Records | ●●●○○ | calc e1RM + détection |
| AI Coach | ●●●●○ | proxy, quotas, validation, coûts |
| Gamification | ●●○○○ | XP/seuils en base |
| Ranking + anti-cheat | ●●●●○ | formules + fraude |
| Subscriptions | ●●●●○ | RevenueCat + config stores + webhook |
| Notifications | ●●○○○ | Expo |
| Analytics | ●●○○○ | instrumentation |
| Admin panel | ●●●○○ | app séparée |

---

## L. Risques techniques

- **R1 — Offline/sync & conflits** (élevé) : une séance ne doit jamais être perdue.
  Mitigation : écriture locale d'abord (SQLite), `client_uuid` idempotent, sync
  op-based, résolution "last-write-wins par set + append PR".
- **R2 — WatermelonDB vs SQLite maison** : WatermelonDB est puissant mais rigide.
  Recommandation : SQLite + couche sync simple d'abord.
- **R3 — Coûts IA non maîtrisés** : quotas + cache + modèle éco obligatoires dès le départ.
- **R4 — Fraude ranking** : sans anti-cheat, les classements perdent toute crédibilité.
- **R5 — Config stores (Apple/Google)** : Apple Sign-In obligatoire si Google/Apple login,
  produits d'abonnement à créer manuellement, review Apple stricte sur paywall/restore.
- **R6 — RLS mal configurée** = fuite de données. Tests RLS automatisés obligatoires.
- **R7 — Expo limites natives** : certaines intégrations (Health V2) nécessiteront un
  dev build/config plugin. OK pour MVP.

## M. Risques business

- Marché fitness saturé → différenciation = **IA + ranking + gym card partageable** (viral loop).
- Conversion Free→Premium dépend d'un paywall non agressif mais bien placé (post-PR, post-programme IA).
- Rétention = streak + notifications + progression visible.
- Coût d'acquisition : miser sur le contenu partageable (TikTok/IG) plutôt que l'ad pur.

## N. Coûts estimés des services (ordre de grandeur, à vérifier)

> Chiffres indicatifs à confirmer sur les pages de pricing officielles au moment du build.

- **Supabase** : Free au début, puis Pro ~25 $/mois ; scale selon DB/Storage/Edge.
- **RevenueCat** : gratuit jusqu'à un seuil de MTR (revenu suivi) puis % — vérifier le palier actuel.
- **IA (Anthropic/OpenAI)** : au token — maîtrisé par quotas/cache ; budget à fixer (ex. plafond mensuel).
- **PostHog** : free tier généreux, puis à l'événement.
- **Sentry** : free tier, puis par volume d'erreurs.
- **Apple Developer** : 99 $/an. **Google Play** : 25 $ une fois.
- **EAS (Expo)** : free tier de builds, puis abonnement selon volume.

Je fournirai des estimations chiffrées par palier d'utilisateurs (1k / 100k / 1M) en Phase 2,
avec les liens officiels — je ne veux pas inventer des tarifs précis ici.

## O. Ce que je recommande de modifier / préciser dans ton idée

1. **Ranking public dès le MVP = risque légal/fraude.** Je recommande : ranking Premium,
   opt-in explicite, pseudonyme, et anti-cheat livré *en même temps* que le leaderboard,
   pas après. (Déjà intégré au plan.)
2. **Sexe/âge :** ne les collecter que si réellement utilisés (calculs de rang, e1RM
   normalisés). Rendre optionnels, justifiés dans l'onboarding (minimisation RGPD).
3. **"Basic AI" au MVP :** la vraie valeur IA (adaptation auto multi-semaines) est
   coûteuse et risquée. Au MVP : progression de charge déterministe + habillage IA.
   L'adaptation avancée arrive en V1.1. Évite de vendre "AI Coach" au-delà du réel.
4. **Offline d'abord sur le workout uniquement** (pas toute l'app) → réduit R1.
5. **Gym card / partage = priorité marketing** : livrer tôt (dès qu'il y a PR + rank),
   c'est ton moteur d'acquisition.
6. **Un seul point de renommage** : `app.config.ts` + `constants/branding.ts` — tout le
   reste référence ces constantes. Aucun nom en dur.
7. **Ne pas promettre "prêt à publier"** sans la checklist stores complète (privacy
   manifest iOS, data safety Google, account deletion visible, screenshots) — Phase 21.

---

## Prochaine étape (Phase 2 — sur ta validation)
Initialiser le monorepo + Expo + config EAS (dev/staging/prod) + `.env.example` +
squelette du Design System — **sans logique métier**, en commits atomiques.
Je ne démarre pas tant que tu n'as pas validé A→O (ou indiqué tes ajustements).
