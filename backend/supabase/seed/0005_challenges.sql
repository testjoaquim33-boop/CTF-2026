-- ============================================================================
-- PROJECT_FIT — Seed 0005 : challenges (défis). Idempotent par slug.
--
-- type = 'metric_target', config = { "metric": <metric>, "target": <n> }.
-- Métriques : workouts | working_sets | volume_kg | prs.
-- Progression calculée côté serveur (get_challenge_progress) sur la fenêtre
-- [starts_at .. ends_at] -> anti-triche.
--
-- Les défis « mensuels » sont fenêtrés sur le mois calendaire courant. Ré-exécuter
-- ce seed rafraîchit la fenêtre au mois courant (do update). Le défi évergreen
-- (sans bornes) est toujours actif.
-- ============================================================================

insert into challenges (slug,name,type,config,is_premium,starts_at,ends_at,is_active) values
  ('month_workouts_12', 'Régularité du mois', 'metric_target', '{"metric":"workouts","target":12}',      false,
     date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second', true),
  ('month_volume_30t',  '30 tonnes ce mois',  'metric_target', '{"metric":"volume_kg","target":30000}',   false,
     date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second', true),
  ('month_sets_150',    '150 séries',         'metric_target', '{"metric":"working_sets","target":150}',  false,
     date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second', true),
  ('evergreen_prs_5',   'Chasseur de records','metric_target', '{"metric":"prs","target":5}',             true,
     null, null, true)
on conflict (slug) do update
  set name       = excluded.name,
      type       = excluded.type,
      config     = excluded.config,
      is_premium = excluded.is_premium,
      starts_at  = excluded.starts_at,
      ends_at    = excluded.ends_at,
      is_active  = excluded.is_active;
