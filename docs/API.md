# PROJECT_FIT — API

L'accès aux données passe par le SDK Supabase (PostgREST) protégé par RLS, plus des
**Edge Functions** pour la logique sensible. Endpoints des fonctions :

| Fonction | Méthode | Auth | Rôle |
|---|---|---|---|
| `ai-recommendation` | POST | JWT | Reco IA (quotas, données lues en base, JSON validé) |
| `leaderboard-submit` | POST | JWT | Publie un score au classement après anti-cheat |
| `revenuecat-webhook` | POST | Secret RevenueCat | Met à jour le statut Premium |
| `account-delete` | POST | JWT | Suppression/anonymisation RGPD |

Accès données (via PostREST, RLS) — exemples :
- `GET exercises` (lecture publique authentifiée) — filtrable muscle/niveau/recherche.
- `GET/POST workouts`, `sets`, `personal_records` — owner only.
- `GET public_leaderboard` (vue) — colonnes publiques uniquement.
- `GET subscriptions` — lecture de son propre statut ; écriture serveur only.

Les corps/réponses détaillés des Edge Functions sont documentés en tête de chaque
fichier `backend/supabase/functions/*/index.ts`.
