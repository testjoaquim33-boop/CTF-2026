-- ============================================================================
-- PROJECT_FIT — PATCH CHALLENGES (à coller UNE fois dans Supabase SQL Editor)
-- Ajoute : fonction get_challenge_progress() (migration 0007)
--        + 4 défis (seed 0005, mensuels + 1 évergreen premium).
-- Sûr et idempotent : ré-exécutable (rafraîchit la fenêtre mensuelle). Transaction.
-- Prérequis : bundle initial (0001–0005) + patch badges appliqués.
-- ============================================================================

begin;

-- >>>>>>>>>>>>>>>> migrations/0007_challenge_progress.sql <<<<<<<<<<<<<<<<
-- ============================================================================
-- PROJECT_FIT — Migration 0007 : progression des challenges
--
-- Fonction RPC qui calcule, CÔTÉ SERVEUR, la progression de l'utilisateur
-- courant pour chaque challenge ACTIF, sur la métrique et la fenêtre de temps
-- définies dans challenges.config. Le client ne fournit aucun chiffre
-- -> anti-triche : impossible de gonfler sa progression.
--
-- config attendu : { "metric": "workouts"|"working_sets"|"volume_kg"|"prs",
--                    "target": <n> }
-- Fenêtre : [starts_at .. min(ends_at, now())]  (bornes optionnelles).
--
-- SECURITY INVOKER (défaut) : RLS appliquée + filtre explicite = auth.uid().
-- ============================================================================

create or replace function get_challenge_progress()
returns table (challenge_id uuid, value numeric)
language sql
stable
as $$
  select
    c.id as challenge_id,
    (case c.config->>'metric'
      when 'workouts' then (
        select count(*) from workouts w
          where w.user_id = auth.uid() and w.status = 'completed'
            and w.completed_at >= win.win_start and w.completed_at <= win.win_end)
      when 'working_sets' then (
        select count(*)
          from sets s
          join workout_exercises we on we.id = s.workout_exercise_id
          join workouts w on w.id = we.workout_id
          where w.user_id = auth.uid() and s.is_warmup = false
            and s.logged_at >= win.win_start and s.logged_at <= win.win_end)
      when 'volume_kg' then (
        select coalesce(sum(s.weight_kg * s.reps), 0)
          from sets s
          join workout_exercises we on we.id = s.workout_exercise_id
          join workouts w on w.id = we.workout_id
          where w.user_id = auth.uid() and s.is_warmup = false
            and s.logged_at >= win.win_start and s.logged_at <= win.win_end)
      when 'prs' then (
        select count(*) from personal_records pr
          where pr.user_id = auth.uid()
            and pr.achieved_at >= win.win_start and pr.achieved_at <= win.win_end)
      else 0
    end)::numeric as value
  from challenges c
  cross join lateral (
    select
      coalesce(c.starts_at, '-infinity'::timestamptz) as win_start,
      least(coalesce(c.ends_at, 'infinity'::timestamptz), now()) as win_end
  ) win
  where c.is_active = true;
$$;

grant execute on function get_challenge_progress() to authenticated;

-- >>>>>>>>>>>>>>>> seed/0005_challenges.sql <<<<<<<<<<<<<<<<
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

commit;
