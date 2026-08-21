# PROJECT_FIT — Déploiement

## Environnements
- `development`, `staging`, `production` (profils EAS dans `apps/mobile/eas.json`).
- Variables publiques via `.env` (`EXPO_PUBLIC_*`). Secrets serveur via
  `supabase secrets set`. Ne jamais committer de secret.

## Base de données
```bash
supabase link --project-ref <ref>
supabase db push                       # applique migrations/
# seed :
supabase db execute --file backend/supabase/seed/0001_seed_core.sql
supabase db execute --file backend/supabase/seed/0002_seed_exercises.sql
```
(Setup depuis le dashboard : voir docs/SETUP_SUPABASE.md.)

## Edge Functions
```bash
supabase functions deploy account-delete
supabase functions deploy ai-recommendation
supabase functions deploy leaderboard-submit
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=... REVENUECAT_WEBHOOK_SECRET=...
```

## Builds mobiles (EAS)
```bash
cd apps/mobile
npx expo install --fix
eas build --profile development --platform ios     # dev build (RevenueCat, notifs)
eas build --profile production --platform ios
eas build --profile production --platform android
eas submit --platform ios       # App Store
eas submit --platform android    # Google Play
```

## OTA
Updates JS via EAS Update (channels dev/staging/production).
