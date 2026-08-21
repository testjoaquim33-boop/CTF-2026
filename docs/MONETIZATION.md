# PROJECT_FIT — Monétisation (RevenueCat)

## Principe
- **RevenueCat** gère les abonnements Apple + Google (jamais de validation maison).
- Le **statut Premium est déterminé côté serveur** : table `subscriptions`, alimentée
  par le webhook RevenueCat (`revenuecat-webhook`). L'app **lit** ce statut (RLS),
  elle ne le décide jamais seule.

## Offres
- Mensuel + Annuel, définis dans **RevenueCat → Offerings** → **prix modifiables sans
  redéployer l'app**. Essai gratuit optionnel via App Store / Play.

## Flux
```
App (react-native-purchases, appUserID = id Supabase)
  └─ achat ─► Apple/Google ─► RevenueCat (valide le reçu)
                                   └─ webhook signé ─► Edge Function revenuecat-webhook
                                                          └─ upsert subscriptions (source de vérité)
App lit subscriptions.status ──► débloque Premium
```

## Ce qui est codé
- `revenuecat-webhook` (Edge Function) : mappe les événements (INITIAL_PURCHASE, RENEWAL,
  CANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE, UNCANCELLATION) → statut
  (`active`/`trial`/`grace`/`expired`), journalise dans `subscription_events`.
- `services/subscription.ts` + `hooks/usePremium.ts` : gating Premium (statut serveur).
- `services/purchases.ts` : wrapper RevenueCat (init/offerings/purchase/restore), activé
  seulement si les clés SDK publiques sont présentes.
- `app/paywall.tsx` : paywall élégant (bénéfices + CTA), non agressif.
- Profil : statut abonnement, passer Premium, restaurer, résiliation gérée côté stores.

## Actions manuelles requises de ta part (indispensables — non codables)
1. **App Store Connect** : créer les produits d'abonnement (mensuel, annuel) + groupe.
2. **Google Play Console** : créer les abonnements équivalents.
3. **RevenueCat** :
   - créer le projet, lier les apps iOS/Android,
   - créer l'**entitlement** `premium` et les **Offerings** (mensuel/annuel),
   - récupérer les **clés SDK publiques** (`appl_...`, `goog_...`) → `.env` :
     `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`,
   - configurer le **webhook** vers l'URL de la fonction
     `https://<ref>.supabase.co/functions/v1/revenuecat-webhook`
     avec l'en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
4. **Supabase** :
   ```bash
   supabase functions deploy revenuecat-webhook --no-verify-jwt
   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<le même secret>
   ```
5. **Build natif** : `react-native-purchases` nécessite un **dev build EAS**
   (ne fonctionne pas dans Expo Go).

> Tant que ces étapes ne sont pas faites, le paywall affiche « Bientôt disponible »
> et le gating Premium fonctionne (personne n'est Premium). Rien ne casse.

## Futur (architecture prête, non développé)
Lifetime, programmes Premium à l'unité, coaching, affiliation, marketplace.
