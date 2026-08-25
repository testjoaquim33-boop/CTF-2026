-- ============================================================================
-- PROJECT_FIT — Migration 0009 : localisation du contenu des exercices
--
-- Ajoute des colonnes FR à côté des colonnes existantes (traitées comme l'anglais
-- par défaut). L'app choisit la colonne selon la langue (repli sur l'anglais si
-- la traduction manque). Le seed 0006 remplit le français.
-- ============================================================================

alter table exercises
  add column if not exists name_fr            text,
  add column if not exists description_fr     text,
  add column if not exists instructions_fr    text[],
  add column if not exists common_mistakes_fr text[];
