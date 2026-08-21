-- ============================================================================
-- PROJECT_FIT — Migration 0002 : Row Level Security (RLS)
-- Principe : un utilisateur n'accède qu'à SES données privées.
-- Le contenu global (exercices, programmes, ranks...) est en lecture publique
-- (authentifiée) ; l'écriture est réservée aux admins (via service_role/Edge).
-- Les tables sensibles (leaderboard, subscriptions) sont écrites uniquement
-- côté serveur (Edge Functions avec service_role, qui bypass RLS).
-- ============================================================================

-- Helper : l'utilisateur courant est-il admin ?
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- Activer RLS partout
-- ---------------------------------------------------------------------------
alter table profiles                  enable row level security;
alter table user_settings             enable row level security;
alter table body_metrics              enable row level security;
alter table goals                     enable row level security;
alter table onboarding_answers        enable row level security;
alter table equipment                 enable row level security;
alter table muscles                   enable row level security;
alter table exercises                 enable row level security;
alter table exercise_muscles          enable row level security;
alter table exercise_equipment        enable row level security;
alter table exercise_variants         enable row level security;
alter table programs                  enable row level security;
alter table program_weeks             enable row level security;
alter table program_sessions          enable row level security;
alter table program_session_exercises enable row level security;
alter table user_programs             enable row level security;
alter table workouts                  enable row level security;
alter table workout_exercises         enable row level security;
alter table sets                      enable row level security;
alter table personal_records          enable row level security;
alter table ai_recommendations        enable row level security;
alter table ai_usage_quota            enable row level security;
alter table levels                    enable row level security;
alter table xp_events                 enable row level security;
alter table user_stats                enable row level security;
alter table achievements              enable row level security;
alter table user_achievements         enable row level security;
alter table ranks                     enable row level security;
alter table rank_thresholds           enable row level security;
alter table ranking_rules             enable row level security;
alter table leaderboard_entries       enable row level security;
alter table subscriptions             enable row level security;
alter table subscription_events       enable row level security;
alter table challenges                enable row level security;
alter table challenge_participants    enable row level security;
alter table notifications             enable row level security;
alter table push_tokens               enable row level security;

-- ---------------------------------------------------------------------------
-- CONTENU GLOBAL — lecture pour tout utilisateur authentifié, écriture admin
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'equipment','muscles','exercises','exercise_muscles','exercise_equipment',
    'exercise_variants','programs','program_weeks','program_sessions',
    'program_session_exercises','levels','achievements','ranks',
    'rank_thresholds','ranking_rules'
  ] loop
    execute format($f$
      create policy %1$s_read on %1$I
        for select to authenticated using (true);
      create policy %1$s_admin_write on %1$I
        for all to authenticated using (is_admin()) with check (is_admin());
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- DONNÉES UTILISATEUR — owner only (SELECT/INSERT/UPDATE/DELETE)
-- Tables dont la PK/colonne d'appartenance est user_id.
-- ---------------------------------------------------------------------------
-- profiles (PK = id = auth.uid())
create policy profiles_select on profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on profiles for delete to authenticated using (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'user_settings','body_metrics','goals','onboarding_answers','user_programs',
    'workouts','personal_records','ai_recommendations','ai_usage_quota',
    'xp_events','user_stats','user_achievements','challenge_participants',
    'notifications','push_tokens'
  ] loop
    execute format($f$
      create policy %1$s_owner_sel on %1$I for select to authenticated using (user_id = auth.uid());
      create policy %1$s_owner_ins on %1$I for insert to authenticated with check (user_id = auth.uid());
      create policy %1$s_owner_upd on %1$I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
      create policy %1$s_owner_del on %1$I for delete to authenticated using (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- DONNÉES UTILISATEUR INDIRECTES (appartenance via parent)
-- ---------------------------------------------------------------------------
-- workout_exercises -> workouts.user_id
create policy we_owner_all on workout_exercises for all to authenticated
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- sets -> workout_exercises -> workouts.user_id
create policy sets_owner_all on sets for all to authenticated
  using (exists (
    select 1 from workout_exercises we join workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()))
  with check (exists (
    select 1 from workout_exercises we join workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- CHALLENGES (contenu) — lecture authentifiée, écriture admin
-- ---------------------------------------------------------------------------
create policy challenges_read on challenges for select to authenticated using (true);
create policy challenges_admin on challenges for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- LEADERBOARD — LECTURE publique (données publiques via vue), ÉCRITURE serveur only
-- Aucune policy d'écriture pour 'authenticated' => insert/update client bloqués.
-- Les Edge Functions (service_role) bypass RLS et écrivent après anti-cheat.
-- ---------------------------------------------------------------------------
create policy leaderboard_read on leaderboard_entries for select to authenticated using (verified);

-- Vue publique exposant UNIQUEMENT les champs publics (jamais de données privées).
create view public_leaderboard as
  select le.exercise_id, le.category, le.region, le.best_score, le.rank_id,
         p.display_name, p.avatar_url
  from leaderboard_entries le
  join profiles p on p.id = le.user_id
  where le.verified;

-- ---------------------------------------------------------------------------
-- ABONNEMENTS — l'utilisateur LIT son statut, n'écrit JAMAIS (webhooks serveur only)
-- ---------------------------------------------------------------------------
create policy subscriptions_read on subscriptions for select to authenticated using (user_id = auth.uid());
-- pas de policy insert/update/delete pour authenticated => écriture bloquée côté client.

-- subscription_events : lecture de ses propres events uniquement.
create policy sub_events_read on subscription_events for select to authenticated using (user_id = auth.uid());
