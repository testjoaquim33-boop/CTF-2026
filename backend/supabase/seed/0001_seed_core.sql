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
