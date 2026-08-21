# PROJECT_FIT — Lancer l'app sur ta machine

> À faire sur TON ordinateur (l'app ne peut pas booter dans l'environnement distant).
> Prérequis : Node 20+, un téléphone avec **Expo Go** (App Store / Play Store) OU un
> simulateur iOS/Android.

## 1. Récupérer le code
```bash
git clone https://github.com/testjoaquim33-boop/CTF-2026.git
cd CTF-2026
git checkout claude/fitness-ai-app-design-m8x5fu
npm install
```

## 2. Configurer les clés Supabase (non secrètes)
Crée le fichier `apps/mobile/.env` :
```
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://yoaxsshvfkmzsamlxati.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ta clé anon>
```

## 3. Aligner les versions natives Expo (une fois)
```bash
cd apps/mobile
npx expo install --fix
```
Cela ajuste automatiquement les versions de `expo-router`, `react-native`, etc.
pour qu'elles soient compatibles avec le SDK Expo installé.

## 4. Lancer
```bash
npx expo start
```
- Scanne le QR code avec **Expo Go** (Android) ou l'appareil photo (iOS), ou
- appuie sur `i` (simulateur iOS) / `a` (émulateur Android).

## Ce que tu peux tester maintenant
1. **Écran de connexion** → « Créer un compte » → email + mot de passe (8+ caractères,
   au moins 1 lettre et 1 chiffre).
2. **Onboarding** (9 écrans) : objectif, niveau, expérience, séances, durée, lieu,
   matériel, infos corporelles.
3. **Terminer** → les réponses sont enregistrées dans Supabase (profil, objectif,
   onboarding_answers, 1re mesure de poids) → arrivée sur les onglets (placeholder).

## Remarques
- Si l'inscription demande une **confirmation d'email** (selon ta config Supabase
  Auth), clique le lien reçu par mail avant de te connecter. Pour tester plus vite,
  tu peux désactiver « Confirm email » dans Supabase → Authentication → Providers → Email.
- Les onglets (Accueil/Séance/Progrès/Classement/Profil) sont des **placeholders**
  pour l'instant — ils seront remplis dans les phases suivantes (Home, Workout, etc.).
- Les icônes/splash utilisent les défauts Expo — les vrais visuels arrivent à la
  phase App Store / Google Play.
