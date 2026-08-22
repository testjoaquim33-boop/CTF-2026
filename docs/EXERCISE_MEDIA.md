# Média des exercices (démonstrations)

La fiche exercice affiche une **grande zone média** en haut (style Hevy). Le
composant `Image` de React Native **anime nativement les GIF/WebP** et, pour la
base libre ci-dessous, **alterne 2 images (position départ ↔ arrivée)** pour
montrer le mouvement — sans dépendance ni rebuild.

## ✅ Solution gratuite et légale (recommandée) — free-exercise-db

**Source** : [free-exercise-db](https://github.com/yuhonas/free-exercise-db) —
licence **Unlicense (domaine public)** : usage **commercial autorisé**, **aucune
attribution requise**. ~800 exercices, 2 images par mouvement, servies via le CDN
**jsDelivr**.

J'ai déjà **mappé tes 52 exercices** à cette base. Il te suffit de coller **un
seul SQL** (aucun upload, aucun fichier à gérer) :

1. Ouvre `backend/supabase/patches/0008_exercise_media_free.sql`
2. Colle son contenu dans **Supabase → SQL Editor → Run**
3. Recharge l'app → chaque exercice affiche une **démonstration animée** (les
   2 frames alternent toutes les 0,9 s).

> Les images pointent vers `cdn.jsdelivr.net/.../<Exercice>/0.jpg` (+ `1.jpg`).
> L'app détecte le `/0.jpg` et alterne automatiquement avec `/1.jpg`.

### ⚠️ Les vraies animations « fluides » type Hevy
Les GIF hyper-fluides de Hevy/MuscleWiki sont du **contenu propriétaire sous
licence** : je ne peux pas les livrer (droits d'auteur). La base libre ci-dessus
donne une démonstration **départ/arrivée animée** — moins fluide qu'un GIF 3D,
mais **gratuite, légale et déjà branchée**. Pour du 100 % fluide, il faudra
licencier une banque d'animations (ex. Gym Visual) ou produire tes propres rendus.

## Alternative — tes propres fichiers (bucket Storage)

Tu peux aussi héberger tes propres médias dans le bucket `exercise-media` :
- Nom de fichier : `<slug>.<ext>` (liste des slugs plus bas).
- Formats : **.webp animé** (recommandé), **.gif animé**, ou **.png** (statique).
- SQL pour pointer dessus :

```sql
update exercises set image_url =
  'https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/'
  || slug || '.webp';
-- (un seul : update exercises set image_url = '.../back-squat.webp' where slug='back-squat';)
```

Tant qu'aucun média n'est trouvé (ou en cas d'erreur de chargement), l'app
affiche l'emoji coloré du groupe musculaire (fallback).

## Liste des 52 slugs

arnold-press, back-squat, band-pull-apart, barbell-bench-press, barbell-curl,
barbell-row, bulgarian-split-squat, cable-fly, cable-lateral-raise, cable-woodchop,
chin-up, close-grip-bench-press, crunch, deadlift, dips-chest, dips-triceps,
dumbbell-bench-press, dumbbell-curl, dumbbell-fly, dumbbell-row,
dumbbell-shoulder-press, face-pull, front-squat, goblet-squat, hammer-curl,
hanging-leg-raise, hip-thrust, incline-barbell-press, incline-dumbbell-press,
incline-push-up, kettlebell-swing, lat-pulldown, lateral-raise, leg-curl,
leg-extension, leg-press, overhead-press, overhead-tricep-extension, plank,
pull-up, push-up, rear-delt-fly, romanian-deadlift, russian-twist, seated-cable-row,
seated-calf-raise, side-plank, standing-calf-raise, trap-bar-deadlift,
tricep-pushdown, walking-lunge, wrist-curl
