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
