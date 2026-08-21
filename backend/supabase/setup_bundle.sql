-- ============================================================================
-- PROJECT_FIT — BUNDLE D'INSTALLATION (à coller dans Supabase SQL Editor)
-- Contient : schéma (0001) + RLS (0002) + provisioning (0003) + seed (core + 52 exercices).
-- Sur un vrai projet Supabase, auth.users / auth.uid() / les rôles existent déjà.
-- Idempotent sur le seed ; à exécuter UNE fois sur une base neuve.
-- ============================================================================


-- >>>>>>>>>>>>>>>>>>>> migrations/0001_init_schema.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- PROJECT_FIT — Migration 0001 : schéma initial
-- Postgres 16 / Supabase. Convention snake_case, PK uuid, timestamps.
-- FK identité -> auth.users(id) (Supabase Auth).
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- Helper: trigger updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type sex_t            as enum ('male','female','unspecified');
create type unit_system_t    as enum ('metric','imperial');
create type level_t          as enum ('beginner','intermediate','advanced');
create type goal_type_t      as enum ('weight_loss','muscle','strength','recomp','endurance','fitness');
create type location_t       as enum ('gym','home','outdoor','mixed');
create type workout_status_t as enum ('planned','in_progress','completed','discarded');
create type pr_type_t        as enum ('est_1rm','max_weight','max_reps','max_volume');
create type muscle_role_t    as enum ('primary','secondary');
create type program_source_t as enum ('seed','ai','custom');
create type sub_status_t     as enum ('active','trial','grace','expired','cancelled','none');
create type store_t          as enum ('app_store','play_store');

-- ---------------------------------------------------------------------------
-- IDENTITÉ & PROFIL
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  sex           sex_t not null default 'unspecified',
  birth_year    int check (birth_year is null or birth_year between 1900 and 2100),
  height_cm     numeric(5,1) check (height_cm is null or height_cm between 50 and 300),
  unit_system   unit_system_t not null default 'metric',
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  locale        text not null default 'en',
  theme         text not null default 'system',
  notif_prefs   jsonb not null default '{}'::jsonb,
  consent       jsonb not null default '{}'::jsonb,
  analytics_opt_in boolean not null default false,
  updated_at    timestamptz not null default now()
);
create trigger trg_user_settings_updated before update on user_settings
  for each row execute function set_updated_at();

create table body_metrics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null default current_date,
  weight_kg     numeric(6,2) not null check (weight_kg between 20 and 500),
  body_fat_pct  numeric(4,1) check (body_fat_pct is null or body_fat_pct between 1 and 70),
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);
create index on body_metrics (user_id, date desc);

create table goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              goal_type_t not null,
  target_weight_kg  numeric(6,2) check (target_weight_kg is null or target_weight_kg between 20 and 500),
  sessions_per_week smallint check (sessions_per_week between 1 and 14),
  session_minutes   smallint check (session_minutes between 10 and 240),
  location          location_t,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_goals_updated before update on goals
  for each row execute function set_updated_at();
create index on goals (user_id) where active;

create table onboarding_answers (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  objective    goal_type_t,
  level        level_t,
  experience   text,
  sessions     smallint,
  duration     smallint,
  location     location_t,
  equipment    text[] not null default '{}',
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- CATALOGUE EXERCICES (contenu global — géré par admin)
-- ---------------------------------------------------------------------------
create table equipment (
  id    uuid primary key default gen_random_uuid(),
  slug  text unique not null,
  name  text not null
);

create table muscles (
  id     uuid primary key default gen_random_uuid(),
  slug   text unique not null,
  name   text not null,
  "group" text not null
);

create table exercises (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  description       text,
  primary_muscle_id uuid references muscles(id),
  level             level_t not null default 'beginner',
  video_url         text,
  image_url         text,
  instructions      text[] not null default '{}',
  common_mistakes   text[] not null default '{}',
  difficulty        smallint not null default 1 check (difficulty between 1 and 5),
  is_bodyweight     boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_exercises_updated before update on exercises
  for each row execute function set_updated_at();
create index on exercises (primary_muscle_id);
create index on exercises (level) where is_active;

create table exercise_muscles (
  exercise_id uuid not null references exercises(id) on delete cascade,
  muscle_id   uuid not null references muscles(id) on delete cascade,
  role        muscle_role_t not null,
  primary key (exercise_id, muscle_id)
);

create table exercise_equipment (
  exercise_id  uuid not null references exercises(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  primary key (exercise_id, equipment_id)
);

create table exercise_variants (
  exercise_id         uuid not null references exercises(id) on delete cascade,
  variant_exercise_id uuid not null references exercises(id) on delete cascade,
  primary key (exercise_id, variant_exercise_id),
  check (exercise_id <> variant_exercise_id)
);

-- ---------------------------------------------------------------------------
-- PROGRAMMES (templates de contenu + instances utilisateur)
-- ---------------------------------------------------------------------------
create table programs (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  goal_type  goal_type_t not null,
  level      level_t not null,
  weeks      smallint not null default 4 check (weeks between 1 and 52),
  is_premium boolean not null default false,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table program_weeks (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  week_number smallint not null,
  unique (program_id, week_number)
);

create table program_sessions (
  id                uuid primary key default gen_random_uuid(),
  program_week_id   uuid not null references program_weeks(id) on delete cascade,
  day_number        smallint not null,
  name              text not null,
  estimated_minutes smallint,
  unique (program_week_id, day_number)
);

create table program_session_exercises (
  id                 uuid primary key default gen_random_uuid(),
  program_session_id uuid not null references program_sessions(id) on delete cascade,
  exercise_id        uuid not null references exercises(id),
  "order"            smallint not null default 0,
  target_sets        smallint,
  target_reps_min    smallint,
  target_reps_max    smallint,
  target_rpe         numeric(3,1),
  rest_seconds       smallint
);
create index on program_session_exercises (program_session_id);

create table user_programs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  program_id uuid references programs(id),
  source     program_source_t not null default 'seed',
  started_at timestamptz not null default now(),
  active     boolean not null default true
);
create index on user_programs (user_id) where active;

-- ---------------------------------------------------------------------------
-- SÉANCES & TRACKING (données utilisateur)
-- ---------------------------------------------------------------------------
create table workouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  user_program_id uuid references user_programs(id) on delete set null,
  name            text,
  status          workout_status_t not null default 'planned',
  started_at      timestamptz,
  completed_at    timestamptz,
  notes           text,
  client_uuid     uuid not null,             -- idempotence offline
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, client_uuid)
);
create trigger trg_workouts_updated before update on workouts
  for each row execute function set_updated_at();
create index on workouts (user_id, started_at desc);

create table workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  "order"     smallint not null default 0
);
create index on workout_exercises (workout_id);

create table sets (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  set_number          smallint not null,
  weight_kg           numeric(6,2) not null default 0 check (weight_kg between 0 and 1000),
  reps                smallint not null default 0 check (reps between 0 and 1000),
  rpe                 numeric(3,1) check (rpe is null or rpe between 1 and 10),
  rest_seconds        smallint check (rest_seconds is null or rest_seconds between 0 and 3600),
  is_warmup           boolean not null default false,
  completed           boolean not null default true,
  logged_at           timestamptz not null default now()
);
create index on sets (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- PROGRESSION & RECORDS
-- ---------------------------------------------------------------------------
create table personal_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  type        pr_type_t not null,
  value       numeric(10,2) not null,
  unit        text not null default 'kg',
  achieved_at timestamptz not null default now(),
  set_id      uuid references sets(id) on delete set null
);
create index on personal_records (user_id, exercise_id, type, achieved_at desc);

-- ---------------------------------------------------------------------------
-- IA
-- ---------------------------------------------------------------------------
create table ai_recommendations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  input_hash text not null,
  request    jsonb not null,
  response   jsonb,
  model      text,
  tokens     int,
  cost_usd   numeric(10,4),
  created_at timestamptz not null default now()
);
create index on ai_recommendations (user_id, created_at desc);
create index on ai_recommendations (input_hash);

create table ai_usage_quota (
  user_id      uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  calls_used   int not null default 0,
  tier         text not null default 'free',
  primary key (user_id, period_start)
);

-- ---------------------------------------------------------------------------
-- GAMIFICATION
-- ---------------------------------------------------------------------------
create table levels (
  level  smallint primary key,
  min_xp int not null,
  title  text not null
);

create table xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  xp         int not null,
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index on xp_events (user_id, created_at desc);

create table user_stats (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  xp               int not null default 0,
  level            smallint not null default 1,
  streak_days      int not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);
create trigger trg_user_stats_updated before update on user_stats
  for each row execute function set_updated_at();

create table achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  criteria    jsonb not null default '{}'::jsonb
);

create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- RANKING (Premium) — seuils & formules EN BASE (configurables)
-- ---------------------------------------------------------------------------
create table ranks (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,   -- bronze..elite
  name       text not null,
  tier_order smallint not null unique,
  color      text
);

create table rank_thresholds (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade, -- null = global
  rank_id     uuid not null references ranks(id) on delete cascade,
  sex         sex_t not null default 'unspecified',
  metric      text not null default 'relative_strength',
  min_value   numeric(10,4) not null,
  max_value   numeric(10,4)
);
create index on rank_thresholds (exercise_id, sex, metric);

create table ranking_rules (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade, -- null = défaut global
  formula     jsonb not null,   -- ex: {"type":"relative_strength"} / {"type":"bodyweight_plus_load"}
  params      jsonb not null default '{}'::jsonb
);

create table leaderboard_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete cascade,
  best_score    numeric(10,4) not null,   -- score métrique (ex force relative)
  best_e1rm     numeric(10,2),
  bodyweight_kg numeric(6,2),
  rank_id       uuid references ranks(id),
  category      text,                       -- catégorie de poids / niveau
  region        text,
  verified      boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (user_id, exercise_id, category)
);
create index on leaderboard_entries (exercise_id, category, best_score desc) where verified;

-- ---------------------------------------------------------------------------
-- ABONNEMENTS (source de vérité = webhooks RevenueCat)
-- ---------------------------------------------------------------------------
create table subscriptions (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  status             sub_status_t not null default 'none',
  product_id         text,
  store              store_t,
  entitlement        text,
  current_period_end timestamptz,
  will_renew         boolean not null default false,
  rc_app_user_id     text,
  updated_at         timestamptz not null default now()
);
create trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();

create table subscription_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now()
);
create index on subscription_events (user_id, received_at desc);

-- ---------------------------------------------------------------------------
-- CHALLENGES (architecture prête)
-- ---------------------------------------------------------------------------
create table challenges (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  type       text not null,
  config     jsonb not null default '{}'::jsonb,
  is_premium boolean not null default false,
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true
);

create table challenge_participants (
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  progress     jsonb not null default '{}'::jsonb,
  joined_at    timestamptz not null default now(),
  completed_at timestamptz,
  primary key (challenge_id, user_id)
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null,
  title         text not null,
  body          text,
  data          jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at       timestamptz,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

create table push_tokens (
  user_id    uuid not null references auth.users(id) on delete cascade,
  expo_token text not null,
  platform   text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_token)
);

-- >>>>>>>>>>>>>>>>>>>> migrations/0002_rls_policies.sql <<<<<<<<<<<<<<<<<<<<

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

-- >>>>>>>>>>>>>>>>>>>> migrations/0003_auth_provisioning.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- PROJECT_FIT — Migration 0003 : provisioning au signup
-- À la création d'un auth.users, créer automatiquement les lignes de base
-- (profiles, user_settings, user_stats, subscriptions=none). SECURITY DEFINER
-- car le trigger s'exécute dans le contexte de auth.
-- ============================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  insert into public.subscriptions (user_id, status) values (new.id, 'none') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- >>>>>>>>>>>>>>>>>>>> seed/0001_seed_core.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- PROJECT_FIT — Seed 0001 : données de référence
-- levels, ranks, rank_thresholds (défaut global), equipment, muscles.
-- Idempotent (on conflict do nothing / upsert par slug).
-- ============================================================================

-- LEVELS (seuils XP configurables — ici valeurs de départ)
insert into levels (level, min_xp, title) values
  (1,0,'Beginner'),(2,100,'Beginner'),(3,250,'Beginner'),(5,600,'Novice'),
  (10,2000,'Intermediate'),(15,4500,'Intermediate'),(25,12000,'Advanced'),
  (40,35000,'Advanced'),(50,60000,'Elite')
on conflict (level) do update set min_xp=excluded.min_xp, title=excluded.title;

-- RANKS
insert into ranks (slug,name,tier_order,color) values
  ('bronze','Bronze',1,'#CD7F32'),
  ('silver','Silver',2,'#C0C0C0'),
  ('gold','Gold',3,'#FFC94D'),
  ('platinum','Platinum',4,'#7FE0D6'),
  ('diamond','Diamond',5,'#6EC1FF'),
  ('elite','Elite',6,'#B57BFF')
on conflict (slug) do update set name=excluded.name, tier_order=excluded.tier_order, color=excluded.color;

-- RANK THRESHOLDS — défaut GLOBAL (exercise_id null), métrique force relative.
-- Valeurs de départ (indicatives) par sexe. Configurables sans redéploiement.
insert into rank_thresholds (exercise_id, rank_id, sex, metric, min_value, max_value)
select null, r.id, s.sex::sex_t, 'relative_strength', v.minv, v.maxv
from (values
  ('bronze',0.00,0.75),('silver',0.75,1.00),('gold',1.00,1.25),
  ('platinum',1.25,1.50),('diamond',1.50,1.75),('elite',1.75,null)
) as v(slug,minv,maxv)
join ranks r on r.slug=v.slug
cross join (values ('male'),('female'),('unspecified')) as s(sex)
on conflict do nothing;

-- Default ranking rule (global): relative strength = lift / bodyweight.
insert into ranking_rules (exercise_id, formula, params)
values (null, '{"type":"relative_strength"}'::jsonb, '{}'::jsonb)
on conflict do nothing;

-- EQUIPMENT
insert into equipment (slug,name) values
  ('none','Bodyweight'),('dumbbell','Dumbbells'),('barbell','Barbell'),
  ('bench','Bench'),('machine','Machine'),('cable','Cable'),
  ('kettlebell','Kettlebell'),('pullup_bar','Pull-up Bar'),
  ('resistance_band','Resistance Band'),('ez_bar','EZ Bar')
on conflict (slug) do nothing;

-- MUSCLES
insert into muscles (slug,name,"group") values
  ('chest','Chest','push'),('front_delts','Front Delts','push'),
  ('side_delts','Side Delts','push'),('rear_delts','Rear Delts','pull'),
  ('triceps','Triceps','push'),('biceps','Biceps','pull'),
  ('lats','Lats','pull'),('upper_back','Upper Back','pull'),
  ('traps','Traps','pull'),('lower_back','Lower Back','posterior'),
  ('quads','Quadriceps','legs'),('hamstrings','Hamstrings','legs'),
  ('glutes','Glutes','legs'),('calves','Calves','legs'),
  ('abs','Abs','core'),('obliques','Obliques','core'),
  ('forearms','Forearms','arms')
on conflict (slug) do nothing;

-- >>>>>>>>>>>>>>>>>>>> seed/0002_seed_exercises.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================================
-- PROJECT_FIT — Seed 0002 : exercices (auto-généré). Idempotent par slug.
-- ============================================================================

insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-bench-press','Barbell Bench Press','Compound horizontal press for chest strength and size.',(select id from muscles where slug='chest'),'intermediate',3,false,'{"Lie flat, grip slightly wider than shoulders.","Lower the bar to mid-chest with control.","Press up until arms are extended."}','{"Bouncing the bar off the chest.","Flaring elbows to 90 degrees."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-bench-press','Dumbbell Bench Press','Dumbbell press allowing a greater range of motion.',(select id from muscles where slug='chest'),'beginner',2,false,'{"Lie flat holding dumbbells at chest level.","Press up until arms extend.","Lower under control."}','{"Letting dumbbells drift forward.","Arching the lower back excessively."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-barbell-press','Incline Barbell Press','Bench press on an incline to target the upper chest.',(select id from muscles where slug='chest'),'intermediate',3,false,'{"Set bench to 30 degrees.","Lower bar to upper chest.","Press up in a straight line."}','{"Setting the incline too steep (turns into shoulder press)."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-dumbbell-press','Incline Dumbbell Press','Incline dumbbell variation for upper chest.',(select id from muscles where slug='chest'),'beginner',2,false,'{"Set bench to 30 degrees.","Press dumbbells up and together.","Lower to upper-chest level."}','{"Clanging dumbbells at the top."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'push-up','Push-up','Fundamental bodyweight pushing exercise.',(select id from muscles where slug='chest'),'beginner',1,true,'{"Hands under shoulders, body in a straight line.","Lower until chest is near the floor.","Press back up."}','{"Sagging hips.","Flaring elbows out wide."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-push-up','Incline Push-up','Easier push-up with hands elevated.',(select id from muscles where slug='chest'),'beginner',1,true,'{"Place hands on a raised surface.","Keep the body straight.","Lower and press."}','{"Letting hips drop."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-fly','Cable Chest Fly','Isolation fly for chest with constant tension.',(select id from muscles where slug='chest'),'beginner',2,false,'{"Set cables to chest height.","Bring handles together in an arc.","Return under control."}','{"Turning it into a press.","Overstretching at the bottom."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-fly','Dumbbell Chest Fly','Chest isolation with dumbbells on a bench.',(select id from muscles where slug='chest'),'intermediate',2,false,'{"Lie flat, slight elbow bend.","Open arms in a wide arc.","Bring dumbbells together above chest."}','{"Bending elbows too much (becomes a press)."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dips-chest','Chest Dips','Bodyweight dips with a forward lean to bias the chest.',(select id from muscles where slug='chest'),'intermediate',3,true,'{"Lean torso forward on parallel bars.","Lower until you feel a chest stretch.","Press back up."}','{"Going too deep and stressing the shoulders."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'overhead-press','Overhead Press','Standing barbell press for shoulder strength.',(select id from muscles where slug='front_delts'),'intermediate',3,false,'{"Grip bar at shoulder width, brace core.","Press overhead, moving head slightly back then through.","Lower to the collarbone."}','{"Excessive lower-back arch.","Pressing the bar forward."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-shoulder-press','Dumbbell Shoulder Press','Seated or standing dumbbell overhead press.',(select id from muscles where slug='front_delts'),'beginner',2,false,'{"Hold dumbbells at shoulder height.","Press overhead.","Lower under control."}','{"Clashing dumbbells at the top."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'arnold-press','Arnold Press','Rotating dumbbell press hitting all three deltoid heads.',(select id from muscles where slug='front_delts'),'intermediate',3,false,'{"Start with palms facing you.","Rotate and press overhead.","Reverse on the way down."}','{"Rotating too fast and losing control."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'lateral-raise','Lateral Raise','Isolation for the side delts.',(select id from muscles where slug='side_delts'),'beginner',1,false,'{"Slight elbow bend, raise arms to the sides.","Stop at shoulder height.","Lower slowly."}','{"Using momentum / swinging.","Shrugging the traps."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-lateral-raise','Cable Lateral Raise','Side delt raise with constant cable tension.',(select id from muscles where slug='side_delts'),'beginner',2,false,'{"Stand side-on to a low cable.","Raise arm to shoulder height.","Lower with control."}','{"Leaning to cheat the weight up."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'rear-delt-fly','Rear Delt Fly','Isolation for the rear deltoids.',(select id from muscles where slug='rear_delts'),'beginner',2,false,'{"Hinge forward, slight elbow bend.","Raise dumbbells out to the sides.","Squeeze shoulder blades."}','{"Using the traps instead of rear delts."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'face-pull','Face Pull','Cable pull to the face for rear delts and upper back health.',(select id from muscles where slug='rear_delts'),'beginner',2,false,'{"Set cable to head height with a rope.","Pull toward your face, elbows high.","Squeeze and return."}','{"Using too much weight and shrugging."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'deadlift','Deadlift','Full-body hip-hinge pulling the bar from the floor.',(select id from muscles where slug='lower_back'),'advanced',4,false,'{"Bar over mid-foot, hinge and grip.","Brace, drive through the floor keeping the bar close.","Lock out hips and knees together."}','{"Rounding the lower back.","Letting the bar drift away from the body."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'romanian-deadlift','Romanian Deadlift','Hip-hinge emphasizing hamstrings and glutes.',(select id from muscles where slug='hamstrings'),'intermediate',3,false,'{"Soft knees, push hips back.","Lower the bar along the legs.","Drive hips forward to stand."}','{"Bending the knees too much (turns into a squat)."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'pull-up','Pull-up','Vertical bodyweight pull; add load for progression.',(select id from muscles where slug='lats'),'intermediate',3,true,'{"Hang with an overhand grip.","Pull until your chin clears the bar.","Lower under control."}','{"Using kipping/momentum for strict reps.","Not reaching full extension."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'chin-up','Chin-up','Underhand vertical pull with more biceps involvement.',(select id from muscles where slug='lats'),'intermediate',3,true,'{"Hang with an underhand grip.","Pull chin over the bar.","Lower fully."}','{"Half range of motion."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'lat-pulldown','Lat Pulldown','Machine vertical pull, scalable for beginners.',(select id from muscles where slug='lats'),'beginner',2,false,'{"Grip the bar wider than shoulders.","Pull to the upper chest.","Return with control."}','{"Leaning back excessively."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-row','Barbell Row','Bent-over horizontal pull for back thickness.',(select id from muscles where slug='upper_back'),'intermediate',3,false,'{"Hinge to ~45 degrees, flat back.","Pull the bar to the lower ribs.","Lower under control."}','{"Standing too upright.","Jerking the weight with the lower back."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-row','Dumbbell Row','Single-arm supported row.',(select id from muscles where slug='lats'),'beginner',2,false,'{"One hand and knee on the bench.","Pull the dumbbell to the hip.","Lower fully."}','{"Rotating the torso to cheat."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'seated-cable-row','Seated Cable Row','Horizontal cable row for mid-back.',(select id from muscles where slug='upper_back'),'beginner',2,false,'{"Sit tall, slight forward lean to start.","Pull the handle to the abdomen.","Squeeze shoulder blades."}','{"Using the lower back to heave."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'trap-bar-deadlift','Trap Bar Deadlift','Beginner-friendly deadlift with a hex bar.',(select id from muscles where slug='glutes'),'beginner',3,false,'{"Stand inside the bar, grip the handles.","Drive through the floor.","Lock out tall."}','{"Rounding the back."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'back-squat','Back Squat','King of lower-body compound movements.',(select id from muscles where slug='quads'),'intermediate',4,false,'{"Bar on upper back, brace core.","Sit down and back to depth.","Drive up through mid-foot."}','{"Knees caving inward.","Heels rising off the floor."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'front-squat','Front Squat','Front-loaded squat emphasizing the quads and core.',(select id from muscles where slug='quads'),'advanced',4,false,'{"Rack the bar on the front delts.","Keep elbows high, squat down.","Drive up staying upright."}','{"Dropping the elbows and rounding forward."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'goblet-squat','Goblet Squat','Beginner squat holding a dumbbell at the chest.',(select id from muscles where slug='quads'),'beginner',2,false,'{"Hold a dumbbell at chest height.","Squat between your knees.","Stand back up."}','{"Leaning too far forward."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-press','Leg Press','Machine compound for quads and glutes.',(select id from muscles where slug='quads'),'beginner',2,false,'{"Feet shoulder-width on the platform.","Lower until knees reach ~90 degrees.","Press without locking out hard."}','{"Letting the lower back round off the pad."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'walking-lunge','Walking Lunge','Unilateral leg movement for quads and glutes.',(select id from muscles where slug='quads'),'beginner',2,false,'{"Step forward and lower the back knee.","Push off to the next step.","Keep the torso upright."}','{"Letting the front knee cave in."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'bulgarian-split-squat','Bulgarian Split Squat','Rear-foot-elevated single-leg squat.',(select id from muscles where slug='quads'),'intermediate',3,false,'{"Rear foot on a bench.","Lower straight down.","Drive up through the front heel."}','{"Leaning too far and losing balance."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-curl','Leg Curl','Machine isolation for the hamstrings.',(select id from muscles where slug='hamstrings'),'beginner',1,false,'{"Adjust the pad above the heels.","Curl toward the glutes.","Lower slowly."}','{"Using momentum."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-extension','Leg Extension','Machine isolation for the quadriceps.',(select id from muscles where slug='quads'),'beginner',1,false,'{"Pad on the lower shins.","Extend the knees fully.","Lower with control."}','{"Swinging the weight."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hip-thrust','Hip Thrust','Glute-focused hip extension.',(select id from muscles where slug='glutes'),'beginner',2,false,'{"Upper back on a bench, bar over hips.","Drive hips up to full extension.","Lower under control."}','{"Overextending the lower back at the top."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'standing-calf-raise','Standing Calf Raise','Calf isolation through a full range.',(select id from muscles where slug='calves'),'beginner',1,false,'{"Balls of feet on a step.","Raise onto the toes fully.","Lower for a deep stretch."}','{"Using a tiny range of motion."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'seated-calf-raise','Seated Calf Raise','Bent-knee calf raise targeting the soleus.',(select id from muscles where slug='calves'),'beginner',1,false,'{"Pad on the lower thighs.","Raise the heels fully.","Lower slowly."}','{"Bouncing the weight."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-curl','Barbell Curl','Classic biceps mass builder.',(select id from muscles where slug='biceps'),'beginner',2,false,'{"Grip shoulder-width, elbows tucked.","Curl to the top.","Lower fully."}','{"Swinging with the lower back."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-curl','Dumbbell Curl','Biceps curl allowing supination.',(select id from muscles where slug='biceps'),'beginner',1,false,'{"Curl one or both dumbbells.","Rotate the pinky up at the top.","Lower slowly."}','{"Using momentum."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hammer-curl','Hammer Curl','Neutral-grip curl for biceps and brachialis.',(select id from muscles where slug='biceps'),'beginner',1,false,'{"Neutral grip, elbows tucked.","Curl up.","Lower under control."}','{"Swinging the weight."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'tricep-pushdown','Triceps Pushdown','Cable isolation for the triceps.',(select id from muscles where slug='triceps'),'beginner',1,false,'{"Elbows pinned to the sides.","Extend down fully.","Return with control."}','{"Letting the elbows flare forward."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'overhead-tricep-extension','Overhead Triceps Extension','Overhead extension biasing the long head.',(select id from muscles where slug='triceps'),'beginner',2,false,'{"Hold weight overhead.","Lower behind the head.","Extend back up."}','{"Flaring the elbows out."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'close-grip-bench-press','Close-Grip Bench Press','Bench variation emphasizing the triceps.',(select id from muscles where slug='triceps'),'intermediate',3,false,'{"Grip inside shoulder width.","Lower to the lower chest, elbows tucked.","Press up."}','{"Gripping too narrow and stressing the wrists."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dips-triceps','Triceps Dips','Upright dips emphasizing the triceps.',(select id from muscles where slug='triceps'),'intermediate',3,true,'{"Stay upright on parallel bars.","Lower to ~90 degrees.","Press back up."}','{"Leaning forward (shifts to chest)."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'wrist-curl','Wrist Curl','Forearm flexor isolation.',(select id from muscles where slug='forearms'),'beginner',1,false,'{"Forearms on the thighs, palms up.","Curl the wrists up.","Lower slowly."}','{"Using too heavy a load."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'plank','Plank','Isometric core stability hold.',(select id from muscles where slug='abs'),'beginner',1,true,'{"Forearms down, body straight.","Brace the abs and glutes.","Hold for time."}','{"Letting the hips sag or pike."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'side-plank','Side Plank','Lateral core and oblique hold.',(select id from muscles where slug='obliques'),'beginner',2,true,'{"On one forearm, body straight sideways.","Lift the hips.","Hold, then switch sides."}','{"Letting the hips drop."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hanging-leg-raise','Hanging Leg Raise','Lower-ab exercise from a bar.',(select id from muscles where slug='abs'),'intermediate',3,true,'{"Hang from a bar.","Raise the legs to hip height or higher.","Lower under control."}','{"Swinging for momentum."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'crunch','Crunch','Basic abdominal flexion.',(select id from muscles where slug='abs'),'beginner',1,true,'{"Lie down, knees bent.","Curl the shoulders off the floor.","Lower slowly."}','{"Pulling on the neck."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-woodchop','Cable Woodchop','Rotational core movement with a cable.',(select id from muscles where slug='obliques'),'beginner',2,false,'{"Set the cable high or low.","Rotate across the body.","Return with control."}','{"Rotating from the lower back instead of the core."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'russian-twist','Russian Twist','Seated rotational oblique exercise.',(select id from muscles where slug='obliques'),'beginner',1,true,'{"Sit with the torso leaning back.","Rotate side to side.","Keep the core braced."}','{"Moving the arms without rotating the torso."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'kettlebell-swing','Kettlebell Swing','Explosive hip-hinge conditioning movement.',(select id from muscles where slug='glutes'),'beginner',2,false,'{"Hinge and hike the bell back.","Snap the hips to swing to chest height.","Let it fall and repeat."}','{"Squatting instead of hinging.","Lifting with the arms."}' on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'band-pull-apart','Band Pull-Apart','Upper-back and rear-delt activation with a band.',(select id from muscles where slug='rear_delts'),'beginner',1,false,'{"Hold a band at shoulder height.","Pull it apart to the chest.","Return with control."}','{"Shrugging the shoulders."}' on conflict (slug) do nothing;

insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='barbell-bench-press' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='barbell-bench-press' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-bench-press' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-bench-press' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='incline-barbell-press' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='incline-barbell-press' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='incline-dumbbell-press' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='incline-dumbbell-press' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='push-up' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='incline-push-up' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='cable-fly' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-fly' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-fly' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dips-chest' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='overhead-press' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-shoulder-press' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='arnold-press' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='lateral-raise' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='cable-lateral-raise' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='rear-delt-fly' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='face-pull' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='deadlift' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='romanian-deadlift' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='pull-up' and q.slug='pullup_bar' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='chin-up' and q.slug='pullup_bar' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='lat-pulldown' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='lat-pulldown' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='barbell-row' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-row' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-row' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='seated-cable-row' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='seated-cable-row' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='trap-bar-deadlift' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='back-squat' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='front-squat' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='goblet-squat' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='leg-press' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='walking-lunge' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='bulgarian-split-squat' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='bulgarian-split-squat' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='leg-curl' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='leg-extension' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='hip-thrust' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='hip-thrust' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='standing-calf-raise' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='standing-calf-raise' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='seated-calf-raise' and q.slug='machine' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='barbell-curl' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='barbell-curl' and q.slug='ez_bar' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dumbbell-curl' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='hammer-curl' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='tricep-pushdown' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='overhead-tricep-extension' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='overhead-tricep-extension' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='close-grip-bench-press' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='close-grip-bench-press' and q.slug='bench' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='dips-triceps' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='wrist-curl' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='wrist-curl' and q.slug='barbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='plank' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='side-plank' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='hanging-leg-raise' and q.slug='pullup_bar' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='crunch' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='cable-woodchop' and q.slug='cable' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='russian-twist' and q.slug='none' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='russian-twist' and q.slug='dumbbell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='kettlebell-swing' and q.slug='kettlebell' on conflict do nothing;
insert into exercise_equipment (exercise_id,equipment_id) select ex.id,q.id from exercises ex, equipment q where ex.slug='band-pull-apart' and q.slug='resistance_band' on conflict do nothing;

insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='barbell-bench-press' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-bench-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-bench-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dumbbell-bench-press' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-bench-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-bench-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='incline-barbell-press' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-barbell-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-barbell-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='incline-dumbbell-press' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-dumbbell-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-dumbbell-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='push-up' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='push-up' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='push-up' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='push-up' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='incline-push-up' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-push-up' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='incline-push-up' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='cable-fly' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='cable-fly' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dumbbell-fly' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dips-chest' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dips-chest' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dips-chest' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='overhead-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='overhead-press' and m.slug='side_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='overhead-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dumbbell-shoulder-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-shoulder-press' and m.slug='side_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-shoulder-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='arnold-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='arnold-press' and m.slug='side_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='arnold-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='lateral-raise' and m.slug='side_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='cable-lateral-raise' and m.slug='side_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='rear-delt-fly' and m.slug='rear_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='rear-delt-fly' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='face-pull' and m.slug='rear_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='face-pull' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='face-pull' and m.slug='traps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='deadlift' and m.slug='lower_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='deadlift' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='deadlift' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='deadlift' and m.slug='traps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='deadlift' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='romanian-deadlift' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='romanian-deadlift' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='romanian-deadlift' and m.slug='lower_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='pull-up' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='pull-up' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='pull-up' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='chin-up' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='chin-up' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='lat-pulldown' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='lat-pulldown' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='lat-pulldown' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='barbell-row' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-row' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-row' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-row' and m.slug='rear_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dumbbell-row' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-row' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-row' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='seated-cable-row' and m.slug='upper_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='seated-cable-row' and m.slug='lats' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='seated-cable-row' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='trap-bar-deadlift' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='trap-bar-deadlift' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='trap-bar-deadlift' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='trap-bar-deadlift' and m.slug='traps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='back-squat' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='back-squat' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='back-squat' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='back-squat' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='front-squat' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='front-squat' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='front-squat' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='goblet-squat' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='goblet-squat' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='goblet-squat' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='leg-press' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='leg-press' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='leg-press' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='walking-lunge' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='walking-lunge' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='walking-lunge' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='bulgarian-split-squat' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='bulgarian-split-squat' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='bulgarian-split-squat' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='leg-curl' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='leg-extension' and m.slug='quads' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='hip-thrust' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='hip-thrust' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='standing-calf-raise' and m.slug='calves' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='seated-calf-raise' and m.slug='calves' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='barbell-curl' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='barbell-curl' and m.slug='forearms' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dumbbell-curl' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dumbbell-curl' and m.slug='forearms' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='hammer-curl' and m.slug='biceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='hammer-curl' and m.slug='forearms' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='tricep-pushdown' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='overhead-tricep-extension' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='close-grip-bench-press' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='close-grip-bench-press' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='close-grip-bench-press' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='dips-triceps' and m.slug='triceps' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dips-triceps' and m.slug='chest' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='dips-triceps' and m.slug='front_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='wrist-curl' and m.slug='forearms' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='plank' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='plank' and m.slug='obliques' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='side-plank' and m.slug='obliques' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='side-plank' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='hanging-leg-raise' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='hanging-leg-raise' and m.slug='obliques' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='crunch' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='cable-woodchop' and m.slug='obliques' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='cable-woodchop' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='russian-twist' and m.slug='obliques' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='russian-twist' and m.slug='abs' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='kettlebell-swing' and m.slug='glutes' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='kettlebell-swing' and m.slug='hamstrings' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='kettlebell-swing' and m.slug='lower_back' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'primary' from exercises ex,muscles m where ex.slug='band-pull-apart' and m.slug='rear_delts' on conflict do nothing;
insert into exercise_muscles (exercise_id,muscle_id,role) select ex.id,m.id,'secondary' from exercises ex,muscles m where ex.slug='band-pull-apart' and m.slug='upper_back' on conflict do nothing;

insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-bench-press' and b.slug='dumbbell-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-bench-press' and b.slug='incline-barbell-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-bench-press' and b.slug='barbell-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-bench-press' and b.slug='incline-dumbbell-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='incline-barbell-press' and b.slug='barbell-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='incline-barbell-press' and b.slug='incline-dumbbell-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='incline-dumbbell-press' and b.slug='incline-barbell-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='incline-dumbbell-press' and b.slug='dumbbell-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='push-up' and b.slug='incline-push-up' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='push-up' and b.slug='dumbbell-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='incline-push-up' and b.slug='push-up' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='cable-fly' and b.slug='dumbbell-fly' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-fly' and b.slug='cable-fly' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dips-chest' and b.slug='dips-triceps' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='overhead-press' and b.slug='dumbbell-shoulder-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='overhead-press' and b.slug='arnold-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-shoulder-press' and b.slug='overhead-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-shoulder-press' and b.slug='arnold-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='arnold-press' and b.slug='dumbbell-shoulder-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='lateral-raise' and b.slug='cable-lateral-raise' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='cable-lateral-raise' and b.slug='lateral-raise' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='rear-delt-fly' and b.slug='face-pull' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='face-pull' and b.slug='rear-delt-fly' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='deadlift' and b.slug='romanian-deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='deadlift' and b.slug='trap-bar-deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='romanian-deadlift' and b.slug='deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='pull-up' and b.slug='chin-up' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='pull-up' and b.slug='lat-pulldown' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='chin-up' and b.slug='pull-up' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='lat-pulldown' and b.slug='pull-up' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-row' and b.slug='dumbbell-row' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-row' and b.slug='seated-cable-row' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-row' and b.slug='barbell-row' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-row' and b.slug='seated-cable-row' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='seated-cable-row' and b.slug='barbell-row' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='trap-bar-deadlift' and b.slug='deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='back-squat' and b.slug='front-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='back-squat' and b.slug='goblet-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='front-squat' and b.slug='back-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='goblet-squat' and b.slug='back-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='leg-press' and b.slug='back-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='walking-lunge' and b.slug='bulgarian-split-squat' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='bulgarian-split-squat' and b.slug='walking-lunge' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='leg-curl' and b.slug='romanian-deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='leg-extension' and b.slug='leg-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='hip-thrust' and b.slug='romanian-deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='standing-calf-raise' and b.slug='seated-calf-raise' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='seated-calf-raise' and b.slug='standing-calf-raise' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-curl' and b.slug='dumbbell-curl' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='barbell-curl' and b.slug='hammer-curl' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-curl' and b.slug='barbell-curl' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dumbbell-curl' and b.slug='hammer-curl' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='hammer-curl' and b.slug='dumbbell-curl' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='tricep-pushdown' and b.slug='overhead-tricep-extension' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='overhead-tricep-extension' and b.slug='tricep-pushdown' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='overhead-tricep-extension' and b.slug='close-grip-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='close-grip-bench-press' and b.slug='dips-triceps' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dips-triceps' and b.slug='dips-chest' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='dips-triceps' and b.slug='close-grip-bench-press' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='plank' and b.slug='side-plank' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='side-plank' and b.slug='plank' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='hanging-leg-raise' and b.slug='crunch' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='crunch' and b.slug='hanging-leg-raise' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='cable-woodchop' and b.slug='side-plank' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='russian-twist' and b.slug='cable-woodchop' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='kettlebell-swing' and b.slug='romanian-deadlift' on conflict do nothing;
insert into exercise_variants (exercise_id,variant_exercise_id) select a.id,b.id from exercises a,exercises b where a.slug='band-pull-apart' and b.slug='face-pull' on conflict do nothing;
