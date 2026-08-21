# PROJECT_FIT — Apple App Store (checklist)

> Rien ici ne peut être fait sans un compte **Apple Developer (99 $/an)** et Xcode/EAS.
> Ne considère jamais l'app « prête à publier » avant d'avoir coché ces éléments.

## Identité
- [ ] Bundle identifier : `com.projectfit.app` (défini dans `app.config.ts`).
- [ ] App name définitif (remplacer PROJECT_FIT dans `src/constants/branding.ts`).
- [ ] App icon (1024×1024) + icônes générées, splash screen.

## Abonnements (obligatoire pour Premium)
- [ ] Produits d'abonnement (mensuel, annuel) créés dans App Store Connect.
- [ ] Groupe d'abonnement + localisations + prix.
- [ ] Liés dans RevenueCat (entitlement `premium`, offerings).
- [ ] Restauration des achats fonctionnelle (bouton Profil).

## Sign in with Apple
- [ ] **Obligatoire** dès qu'on propose Google Sign In. Capability activée + provider
      Supabase configuré (voir docs/SETUP_SUPABASE.md).

## Confidentialité (App Privacy)
- [ ] Privacy Policy en ligne (URL publique).
- [ ] Déclarations « App Privacy » (données collectées : email, données de santé/fitness
      saisies par l'utilisateur, identifiants). Minimisation appliquée.
- [ ] **Account deletion** accessible dans l'app (fait : Profil → Supprimer le compte)
      — Apple l'exige pour les apps avec création de compte.
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) si requis par les SDK utilisés.

## Contenu
- [ ] Screenshots par taille d'écran requise.
- [ ] Description, mots-clés, catégorie (Health & Fitness).
- [ ] Age rating (questionnaire).
- [ ] Mentions : « ne remplace pas un avis médical » (disclaimer présent dans l'app).

## Build & soumission
- [ ] `eas build --profile production --platform ios`
- [ ] `eas submit --platform ios`
- [ ] Test TestFlight avant release.
