# PROJECT_FIT — Setup Supabase (actions manuelles requises)

Tu n'as pas encore de projet Supabase. Voici exactement quoi faire. Rien de tout
ceci ne peut être fait par le code — ce sont des étapes console.

## 1. Créer le projet
1. Va sur https://supabase.com → **New project**.
2. Note la **région** (choisis proche de tes premiers utilisateurs).
3. Récupère dans *Project Settings → API* :
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → ⚠️ **SECRET SERVEUR UNIQUEMENT**. Ne jamais la mettre
     dans l'app, `.env` mobile, ou Git. Elle sert seulement aux Edge Functions.

## 2. Configurer les variables locales
```bash
cp .env.example apps/mobile/.env
# éditer apps/mobile/.env : coller URL + anon key (valeurs publiques, OK)
```

## 3. Appliquer les migrations + seed
Avec la CLI Supabase (https://supabase.com/docs/guides/cli) :
```bash
supabase link --project-ref <ref>
supabase db push        # applique backend/supabase/migrations/*.sql
# puis charger le seed :
supabase db execute --file backend/supabase/seed/0001_seed_core.sql
supabase db execute --file backend/supabase/seed/0002_seed_exercises.sql
```
> Sur le vrai projet, `auth`, `auth.uid()` et les rôles existent déjà — n'applique
> QUE `migrations/` et `seed/`. Le harness local `validate_local.sh` ne sert qu'à
> la CI locale.

## 4. Auth email/password
Dans *Authentication → Providers → Email* :
- Activer **Confirm email** (vérification d'email).
- Configurer les templates (reset password, confirmation) et l'URL de redirection.

## 5. Déployer l'Edge Function de suppression de compte
```bash
supabase functions deploy account-delete
```
`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement dans
les Edge Functions par la plateforme — rien à coller.

## 6. (Plus tard) Apple Sign In & Google Sign In
Ces providers sont **câblés dans le code mais désactivés** (`OAUTH_ENABLED`) tant
que la configuration native n'est pas faite. Quand tu voudras les activer :

### Apple (obligatoire dès qu'on propose Google sur iOS — règle App Store)
1. Apple Developer → activer **Sign in with Apple** pour l'App ID.
2. Créer un **Services ID** + clé, configurer le provider Apple dans
   *Supabase → Authentication → Providers → Apple*.
3. Ajouter `expo-apple-authentication` et le plugin dans `app.config.ts`.

### Google
1. Google Cloud Console → OAuth consent screen + **OAuth client IDs**
   (iOS, Android, Web).
2. Renseigner le provider Google dans Supabase.
3. Ajouter `@react-native-google-signin/google-signin` (nécessite un dev build EAS).

> Je fournirai le code natif d'intégration à ce moment-là. Sans tes identifiants
> OAuth, je ne peux pas le finaliser — je ne vais pas inventer des IDs.

## Ce qui est déjà codé (Phase 5)
- Client Supabase sécurisé (session dans SecureStore) : `apps/mobile/src/services/supabase.ts`
- API auth email/password + reset + logout + delete : `apps/mobile/src/services/auth.ts`
- Store de session (Zustand) : `apps/mobile/src/store/auth.ts`
- Trigger de provisioning au signup : `migrations/0003_auth_provisioning.sql` (vérifié)
- Edge Function suppression RGPD : `backend/supabase/functions/account-delete/`

## 3-bis. Alternative sans CLI : SQL Editor (recommandé si tu es sur le dashboard)
Si tu n'utilises pas la CLI Supabase, installe tout via le **SQL Editor** :
1. Dashboard Supabase → icône **SQL Editor** (menu de gauche) → **New query**.
2. Ouvre `backend/supabase/setup_bundle.sql` (dans ce repo), copie **tout** le contenu.
3. Colle dans l'éditeur → **Run**.
4. Résultat attendu : aucune erreur ; la table `exercises` contient **52** lignes.
   Vérifier : `select count(*) from exercises;` → 52.

Ce bundle regroupe schéma + RLS + provisioning + seed. À exécuter **une seule fois**
sur une base neuve. (Il a été validé : s'applique sans erreur, 52 exercices, RLS active.)
