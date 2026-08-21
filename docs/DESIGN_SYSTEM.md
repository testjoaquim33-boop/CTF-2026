# PROJECT_FIT — Design System (Phase 3, en cours)

Objectif : interface moderne, premium, sportive, minimaliste. **Dark-first**, Light prévu.
Aucun composant ne référence un hex ou une taille en dur — tout passe par les tokens.

## Tokens
- **Couleurs** : `src/theme/colors.ts` — 1 primaire sportive (`#FF4D2E`), neutres,
  sémantiques (success/warning/danger/info), couleurs de rang (bronze→elite).
  Deux schemes : `darkColors`, `lightColors` (même interface `ColorScheme`).
- **Spacing** : échelle 4pt (`xs..xxxl`) — `src/theme/tokens.ts`.
- **Radius** : `sm..xl` + `pill`.
- **Typography** : display/h1/h2/h3/body/caption/overline (famille chargée via expo-font plus tard).
- **Durations** : fast/base/slow (animations sobres, pas d'excès).

## Thème
`src/theme/theme.ts` expose `darkTheme` / `lightTheme` (objet `Theme`).
Un `ThemeProvider` + hook `useTheme()` seront ajoutés avec les premiers écrans.

## Renommage de l'app
Un seul endroit : `src/constants/branding.ts` (+ `app.config.ts` qui le lit).
Nom, slug, bundle id iOS, package Android, scheme, couleur primaire.

## Composants prévus (à venir)
Button, Card, Text, Input, Badge, RankBadge, ProgressBar, StatTile, Chart wrappers.
Chacun consommera exclusivement les tokens.

## Statut de vérification
- ✅ Tokens `theme/*` + `branding.ts` : typecheck strict OK (isolé).
- ⏳ App Expo complète : **non installée/bootée dans cet environnement distant**
  (install natif = risque disque). Config prête ; à lancer côté machine dev via
  `npm install` puis `npx expo install --fix` (aligne les versions natives),
  puis `npm run dev -w apps/mobile`.
