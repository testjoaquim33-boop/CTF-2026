-- ============================================================================
-- PROJECT_FIT — Media : vidéos de démonstration + pipeline images (Storage)
-- À coller dans le SQL Editor de Supabase. Idempotent.
-- ============================================================================

-- 1) VIDÉOS : lien de démonstration YouTube (recherche "<exercice> proper form").
--    Fiable (ne casse jamais) et ouvre des tutos pertinents. Remplaçable plus
--    tard par des vidéos précises.
update exercises
set video_url = 'https://www.youtube.com/results?search_query='
  || replace(name, ' ', '+') || '+proper+form';

-- 2) IMAGES : bucket public "exercise-media".
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

-- Chaque exercice pointe vers <slug>.png dans le bucket. Tant que le fichier
-- n'est pas uploadé, l'app affiche automatiquement l'emoji coloré du groupe
-- musculaire (fallback onError). Dès que tu uploades le fichier, l'image apparaît.
update exercises
set image_url = 'https://yoaxsshvfkmzsamlxati.supabase.co/storage/v1/object/public/exercise-media/'
  || slug || '.png';
