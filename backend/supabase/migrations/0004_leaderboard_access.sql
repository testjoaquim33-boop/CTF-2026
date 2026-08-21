-- ============================================================================
-- PROJECT_FIT — Migration 0004 : accès au classement
-- 1) Restreint la lecture DIRECTE de leaderboard_entries aux lignes de
--    l'utilisateur (évite d'exposer le poids de corps des autres).
-- 2) Expose les classements publics via la vue public_leaderboard (droits du
--    propriétaire), qui ne montre que display_name + score + rang.
-- ============================================================================

-- Remplace la politique de lecture large (verified) par "mes lignes uniquement".
drop policy if exists leaderboard_read on leaderboard_entries;
create policy leaderboard_own_read on leaderboard_entries
  for select to authenticated using (user_id = auth.uid());

-- Lecture du classement public (colonnes sûres uniquement) via la vue.
grant select on public_leaderboard to authenticated, anon;
