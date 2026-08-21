# PROJECT_FIT — Google Play (checklist)

> Nécessite un compte **Google Play Console (25 $ une fois)**.

## Identité
- [ ] Package name : `com.projectfit.app` (défini dans `app.config.ts`).
- [ ] Icône (512×512), feature graphic, splash.

## Abonnements
- [ ] Abonnements (mensuel, annuel) créés dans Play Console.
- [ ] Liés dans RevenueCat.
- [ ] Restauration des achats OK.

## Data safety & confidentialité
- [ ] Formulaire **Data safety** rempli (données collectées/partagées, chiffrement,
      suppression). Cohérent avec la politique de confidentialité.
- [ ] Privacy Policy en ligne.
- [ ] **Suppression de compte** : lien in-app (fait) + éventuellement page web de
      demande de suppression (exigence Google pour comptes).

## Contenu
- [ ] Content rating (questionnaire IARC).
- [ ] Screenshots téléphone/tablette, description courte + longue.
- [ ] Catégorie : Santé et remise en forme.

## Build & soumission
- [ ] `eas build --profile production --platform android` (AAB).
- [ ] `eas submit --platform android`.
- [ ] Test en piste interne avant production.
