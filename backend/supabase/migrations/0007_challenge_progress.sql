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
