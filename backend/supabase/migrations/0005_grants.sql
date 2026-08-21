-- ============================================================================
-- PROJECT_FIT — Migration 0005 : GRANTs de rôle (Supabase)
-- Les tables créées manuellement n'ont pas reçu les privilèges par défaut des
-- rôles clients. On les accorde ici. La RLS reste la garde-fou au niveau LIGNE :
-- ces GRANTs donnent l'accès à la TABLE, les policies décident des lignes.
-- (Ex. leaderboard_entries/subscriptions n'ont pas de policy d'écriture ->
--  l'écriture client reste refusée même avec ce GRANT.)
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Pour les futures tables aussi :
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
