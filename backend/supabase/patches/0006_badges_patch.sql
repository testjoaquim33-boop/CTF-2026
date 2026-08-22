-- ============================================================================
-- PROJECT_FIT — PATCH BADGES (à coller UNE fois dans Supabase SQL Editor)
-- Ajoute : fonction d'agrégats get_achievement_stats() (migration 0006)
--        + catalogue de 18 badges (seed 0004).
-- Sûr et idempotent : ré-exécutable sans risque. Enveloppé en transaction.
-- Prérequis : bundle d'installation initial déjà appliqué (0001–0005).
-- ============================================================================

begin;

-- >>>>>>>>>>>>>>>> migrations/0006_achievement_stats.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> seed/0004_achievements.sql <<<<<<<<<<<<<<<<
-- ============================================================================
-- PROJECT_FIT — Seed 0004 : badges (achievements). Idempotent par slug.
--
-- Le critère est stocké en JSONB { "metric": <metric>, "gte": <n> } et évalué
-- côté serveur/app à partir d'agrégats calculés sur la source de vérité
-- (séances, séries, records, classement). Aucune donnée n'est fournie par le
-- client -> anti-triche.
--
-- Métriques supportées : total_workouts, streak_days, level, total_prs,
--                        total_working_sets, total_volume_kg, ranked_exercises.
-- Modifier un seuil ici (ou en base) suffit : aucun redéploiement d'app requis.
-- ============================================================================

insert into achievements (slug,name,description,icon,criteria) values
  ('first_workout',   'Premier pas',        'Termine ta toute première séance.',              '🎯', '{"metric":"total_workouts","gte":1}'),
  ('ten_workouts',    'Assidu',             'Termine 10 séances.',                            '💪', '{"metric":"total_workouts","gte":10}'),
  ('fifty_workouts',  'Machine',            'Termine 50 séances.',                            '🏋️', '{"metric":"total_workouts","gte":50}'),
  ('hundred_workouts','Vétéran',            'Termine 100 séances.',                           '🦾', '{"metric":"total_workouts","gte":100}'),
  ('streak_3',        'En rythme',          'Enchaîne 3 jours consécutifs.',                  '🔥', '{"metric":"streak_days","gte":3}'),
  ('streak_7',        'Semaine parfaite',   'Enchaîne 7 jours consécutifs.',                  '🌟', '{"metric":"streak_days","gte":7}'),
  ('streak_30',       'Inarrêtable',        'Enchaîne 30 jours consécutifs.',                 '⚡', '{"metric":"streak_days","gte":30}'),
  ('level_5',         'Progression',        'Atteins le niveau 5.',                           '📈', '{"metric":"level","gte":5}'),
  ('level_10',        'Confirmé',           'Atteins le niveau 10.',                          '🎖️', '{"metric":"level","gte":10}'),
  ('level_25',        'Élite',              'Atteins le niveau 25.',                          '👑', '{"metric":"level","gte":25}'),
  ('first_pr',        'Nouveau record !',   'Bats ton premier record personnel.',             '🥇', '{"metric":"total_prs","gte":1}'),
  ('ten_prs',         'Casseur de records', 'Bats 10 records personnels.',                    '🏆', '{"metric":"total_prs","gte":10}'),
  ('sets_100',        'Centurion',          'Réalise 100 séries de travail.',                 '🧱', '{"metric":"total_working_sets","gte":100}'),
  ('sets_500',        'Forgeron',           'Réalise 500 séries de travail.',                 '⚒️', '{"metric":"total_working_sets","gte":500}'),
  ('volume_50t',      '50 tonnes',          'Soulève 50 000 kg cumulés.',                     '🐘', '{"metric":"total_volume_kg","gte":50000}'),
  ('volume_250t',     'Tonnage lourd',      'Soulève 250 000 kg cumulés.',                    '🚚', '{"metric":"total_volume_kg","gte":250000}'),
  ('ranked_1',        'Dans l''arène',      'Publie un premier score au classement.',         '⚔️', '{"metric":"ranked_exercises","gte":1}'),
  ('ranked_5',        'Compétiteur',        'Publie 5 exercices au classement.',              '🛡️', '{"metric":"ranked_exercises","gte":5}')
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      icon        = excluded.icon,
      criteria    = excluded.criteria;

commit;
