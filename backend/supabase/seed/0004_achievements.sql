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
