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
