# Média des exercices (photos / démonstrations animées)

La fiche exercice affiche une **grande zone média** en haut (style Hevy).
Le composant `Image` de React Native **anime automatiquement les GIF et WebP**
— aucune dépendance ni rebuild nécessaire. Tant qu'aucun fichier n'est
uploadé (ou en cas d'erreur), l'app affiche l'emoji coloré du groupe musculaire.

## Comment ça marche

- Chaque exercice a une colonne `image_url` en base qui pointe vers un fichier
  du bucket public `exercise-media`.
- Nom de fichier attendu : `<slug>.<ext>` (liste des slugs plus bas).
- Formats : **.webp animé** (recommandé, léger), **.gif animé**, ou **.png** (statique).
- Fond blanc + `resizeMode=contain` : idéal pour les rendus anatomiques type Hevy.

## ⚠️ Sourcing du contenu (important)

Les animations type Hevy/MuscleWiki sont du **contenu sous licence** : tu dois les
**produire ou les licencier** toi-même (banques d'animations fitness, rendus 3D
commandés, ou tes propres vidéos converties en WebP/GIF). Ne réutilise pas des GIF
d'une autre app sans autorisation — risque juridique pour une app commerciale.

## Étapes

1. Prépare un fichier par exercice, nommé exactement `<slug>.webp` (ou .gif/.png).
2. Upload dans **Storage -> exercise-media** (bucket public déjà créé).
3. Si tu utilises .webp ou .gif au lieu de .png, exécute le SQL ci-dessous.

## SQL — basculer l'extension du média (SQL Editor)

```sql
-- Tout en WebP animé :
update exercises set image_url =
  'https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/'
  || slug || '.webp';

-- (ou '.gif' ; défaut actuel = '.png'.)
-- Un seul exercice :
-- update exercises set image_url = '.../exercise-media/back-squat.webp' where slug='back-squat';
```

## Liste des 52 slugs (= noms de fichiers attendus, sans extension)

- `arnold-press`
- `back-squat`
- `band-pull-apart`
- `barbell-bench-press`
- `barbell-curl`
- `barbell-row`
- `bulgarian-split-squat`
- `cable-fly`
- `cable-lateral-raise`
- `cable-woodchop`
- `chin-up`
- `close-grip-bench-press`
- `crunch`
- `deadlift`
- `dips-chest`
- `dips-triceps`
- `dumbbell-bench-press`
- `dumbbell-curl`
- `dumbbell-fly`
- `dumbbell-row`
- `dumbbell-shoulder-press`
- `face-pull`
- `front-squat`
- `goblet-squat`
- `hammer-curl`
- `hanging-leg-raise`
- `hip-thrust`
- `incline-barbell-press`
- `incline-dumbbell-press`
- `incline-push-up`
- `kettlebell-swing`
- `lat-pulldown`
- `lateral-raise`
- `leg-curl`
- `leg-extension`
- `leg-press`
- `overhead-press`
- `overhead-tricep-extension`
- `plank`
- `pull-up`
- `push-up`
- `rear-delt-fly`
- `romanian-deadlift`
- `russian-twist`
- `seated-cable-row`
- `seated-calf-raise`
- `side-plank`
- `standing-calf-raise`
- `trap-bar-deadlift`
- `tricep-pushdown`
- `walking-lunge`
- `wrist-curl`
