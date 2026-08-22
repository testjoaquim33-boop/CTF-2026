-- ============================================================================
-- PROJECT_FIT — Migration 0006 : agrégats pour les badges (achievements)
--
-- Fonction RPC qui calcule, CÔTÉ SERVEUR, les agrégats de l'utilisateur courant
-- à partir de la source de vérité (séances, séries, records, classement).
-- Le client ne fournit AUCUN chiffre -> anti-triche : impossible de gonfler ses
-- stats pour débloquer des badges.
--
-- SECURITY INVOKER (défaut) : la fonction s'exécute avec les droits de l'appelant,
-- donc la RLS s'applique et chaque utilisateur ne voit que ses propres lignes.
-- Le filtre explicite `= auth.uid()` est une garde supplémentaire (defense-in-depth).
-- ============================================================================

create or replace function get_achievement_stats()
returns table (
  total_workouts     bigint,
  streak_days        int,
  level              int,
  total_prs          bigint,
  total_working_sets bigint,
  total_volume_kg    numeric,
  ranked_exercises   bigint
)
language sql
stable
as $$
  select
    (select count(*) from workouts w
       where w.user_id = auth.uid() and w.status = 'completed')                    as total_workouts,
    coalesce((select us.streak_days from user_stats us where us.user_id = auth.uid()), 0) as streak_days,
    coalesce((select us.level       from user_stats us where us.user_id = auth.uid()), 1) as level,
    (select count(*) from personal_records pr
       where pr.user_id = auth.uid())                                              as total_prs,
    (select count(*)
       from sets s
       join workout_exercises we on we.id = s.workout_exercise_id
       join workouts w on w.id = we.workout_id
       where w.user_id = auth.uid() and s.is_warmup = false)                       as total_working_sets,
    coalesce((select sum(s.weight_kg * s.reps)
       from sets s
       join workout_exercises we on we.id = s.workout_exercise_id
       join workouts w on w.id = we.workout_id
       where w.user_id = auth.uid() and s.is_warmup = false), 0)                   as total_volume_kg,
    (select count(*) from leaderboard_entries le
       where le.user_id = auth.uid())                                             as ranked_exercises;
$$;

grant execute on function get_achievement_stats() to authenticated;
