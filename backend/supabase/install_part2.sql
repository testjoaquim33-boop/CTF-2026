-- ########## PROJECT_FIT — PART 2/2 : DONNEES (ranks, muscles, 52 exercices) ##########
-- À lancer EN SECOND, après la Part 1.

begin;

-- ===== seed/0001_seed_core.sql =====

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

-- ===== seed/0002_seed_exercises.sql =====

-- ============================================================================
-- PROJECT_FIT — Seed 0002 : exercices (auto-généré). Idempotent par slug.
-- ============================================================================

insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-bench-press','Barbell Bench Press','Compound horizontal press for chest strength and size.',(select id from muscles where slug='chest'),'intermediate',3,false,ARRAY['Lie flat, grip slightly wider than shoulders.','Lower the bar to mid-chest with control.','Press up until arms are extended.']::text[],ARRAY['Bouncing the bar off the chest.','Flaring elbows to 90 degrees.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-bench-press','Dumbbell Bench Press','Dumbbell press allowing a greater range of motion.',(select id from muscles where slug='chest'),'beginner',2,false,ARRAY['Lie flat holding dumbbells at chest level.','Press up until arms extend.','Lower under control.']::text[],ARRAY['Letting dumbbells drift forward.','Arching the lower back excessively.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-barbell-press','Incline Barbell Press','Bench press on an incline to target the upper chest.',(select id from muscles where slug='chest'),'intermediate',3,false,ARRAY['Set bench to 30 degrees.','Lower bar to upper chest.','Press up in a straight line.']::text[],ARRAY['Setting the incline too steep (turns into shoulder press).']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-dumbbell-press','Incline Dumbbell Press','Incline dumbbell variation for upper chest.',(select id from muscles where slug='chest'),'beginner',2,false,ARRAY['Set bench to 30 degrees.','Press dumbbells up and together.','Lower to upper-chest level.']::text[],ARRAY['Clanging dumbbells at the top.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'push-up','Push-up','Fundamental bodyweight pushing exercise.',(select id from muscles where slug='chest'),'beginner',1,true,ARRAY['Hands under shoulders, body in a straight line.','Lower until chest is near the floor.','Press back up.']::text[],ARRAY['Sagging hips.','Flaring elbows out wide.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'incline-push-up','Incline Push-up','Easier push-up with hands elevated.',(select id from muscles where slug='chest'),'beginner',1,true,ARRAY['Place hands on a raised surface.','Keep the body straight.','Lower and press.']::text[],ARRAY['Letting hips drop.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-fly','Cable Chest Fly','Isolation fly for chest with constant tension.',(select id from muscles where slug='chest'),'beginner',2,false,ARRAY['Set cables to chest height.','Bring handles together in an arc.','Return under control.']::text[],ARRAY['Turning it into a press.','Overstretching at the bottom.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-fly','Dumbbell Chest Fly','Chest isolation with dumbbells on a bench.',(select id from muscles where slug='chest'),'intermediate',2,false,ARRAY['Lie flat, slight elbow bend.','Open arms in a wide arc.','Bring dumbbells together above chest.']::text[],ARRAY['Bending elbows too much (becomes a press).']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dips-chest','Chest Dips','Bodyweight dips with a forward lean to bias the chest.',(select id from muscles where slug='chest'),'intermediate',3,true,ARRAY['Lean torso forward on parallel bars.','Lower until you feel a chest stretch.','Press back up.']::text[],ARRAY['Going too deep and stressing the shoulders.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'overhead-press','Overhead Press','Standing barbell press for shoulder strength.',(select id from muscles where slug='front_delts'),'intermediate',3,false,ARRAY['Grip bar at shoulder width, brace core.','Press overhead, moving head slightly back then through.','Lower to the collarbone.']::text[],ARRAY['Excessive lower-back arch.','Pressing the bar forward.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-shoulder-press','Dumbbell Shoulder Press','Seated or standing dumbbell overhead press.',(select id from muscles where slug='front_delts'),'beginner',2,false,ARRAY['Hold dumbbells at shoulder height.','Press overhead.','Lower under control.']::text[],ARRAY['Clashing dumbbells at the top.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'arnold-press','Arnold Press','Rotating dumbbell press hitting all three deltoid heads.',(select id from muscles where slug='front_delts'),'intermediate',3,false,ARRAY['Start with palms facing you.','Rotate and press overhead.','Reverse on the way down.']::text[],ARRAY['Rotating too fast and losing control.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'lateral-raise','Lateral Raise','Isolation for the side delts.',(select id from muscles where slug='side_delts'),'beginner',1,false,ARRAY['Slight elbow bend, raise arms to the sides.','Stop at shoulder height.','Lower slowly.']::text[],ARRAY['Using momentum / swinging.','Shrugging the traps.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-lateral-raise','Cable Lateral Raise','Side delt raise with constant cable tension.',(select id from muscles where slug='side_delts'),'beginner',2,false,ARRAY['Stand side-on to a low cable.','Raise arm to shoulder height.','Lower with control.']::text[],ARRAY['Leaning to cheat the weight up.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'rear-delt-fly','Rear Delt Fly','Isolation for the rear deltoids.',(select id from muscles where slug='rear_delts'),'beginner',2,false,ARRAY['Hinge forward, slight elbow bend.','Raise dumbbells out to the sides.','Squeeze shoulder blades.']::text[],ARRAY['Using the traps instead of rear delts.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'face-pull','Face Pull','Cable pull to the face for rear delts and upper back health.',(select id from muscles where slug='rear_delts'),'beginner',2,false,ARRAY['Set cable to head height with a rope.','Pull toward your face, elbows high.','Squeeze and return.']::text[],ARRAY['Using too much weight and shrugging.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'deadlift','Deadlift','Full-body hip-hinge pulling the bar from the floor.',(select id from muscles where slug='lower_back'),'advanced',4,false,ARRAY['Bar over mid-foot, hinge and grip.','Brace, drive through the floor keeping the bar close.','Lock out hips and knees together.']::text[],ARRAY['Rounding the lower back.','Letting the bar drift away from the body.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'romanian-deadlift','Romanian Deadlift','Hip-hinge emphasizing hamstrings and glutes.',(select id from muscles where slug='hamstrings'),'intermediate',3,false,ARRAY['Soft knees, push hips back.','Lower the bar along the legs.','Drive hips forward to stand.']::text[],ARRAY['Bending the knees too much (turns into a squat).']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'pull-up','Pull-up','Vertical bodyweight pull; add load for progression.',(select id from muscles where slug='lats'),'intermediate',3,true,ARRAY['Hang with an overhand grip.','Pull until your chin clears the bar.','Lower under control.']::text[],ARRAY['Using kipping/momentum for strict reps.','Not reaching full extension.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'chin-up','Chin-up','Underhand vertical pull with more biceps involvement.',(select id from muscles where slug='lats'),'intermediate',3,true,ARRAY['Hang with an underhand grip.','Pull chin over the bar.','Lower fully.']::text[],ARRAY['Half range of motion.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'lat-pulldown','Lat Pulldown','Machine vertical pull, scalable for beginners.',(select id from muscles where slug='lats'),'beginner',2,false,ARRAY['Grip the bar wider than shoulders.','Pull to the upper chest.','Return with control.']::text[],ARRAY['Leaning back excessively.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-row','Barbell Row','Bent-over horizontal pull for back thickness.',(select id from muscles where slug='upper_back'),'intermediate',3,false,ARRAY['Hinge to ~45 degrees, flat back.','Pull the bar to the lower ribs.','Lower under control.']::text[],ARRAY['Standing too upright.','Jerking the weight with the lower back.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-row','Dumbbell Row','Single-arm supported row.',(select id from muscles where slug='lats'),'beginner',2,false,ARRAY['One hand and knee on the bench.','Pull the dumbbell to the hip.','Lower fully.']::text[],ARRAY['Rotating the torso to cheat.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'seated-cable-row','Seated Cable Row','Horizontal cable row for mid-back.',(select id from muscles where slug='upper_back'),'beginner',2,false,ARRAY['Sit tall, slight forward lean to start.','Pull the handle to the abdomen.','Squeeze shoulder blades.']::text[],ARRAY['Using the lower back to heave.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'trap-bar-deadlift','Trap Bar Deadlift','Beginner-friendly deadlift with a hex bar.',(select id from muscles where slug='glutes'),'beginner',3,false,ARRAY['Stand inside the bar, grip the handles.','Drive through the floor.','Lock out tall.']::text[],ARRAY['Rounding the back.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'back-squat','Back Squat','King of lower-body compound movements.',(select id from muscles where slug='quads'),'intermediate',4,false,ARRAY['Bar on upper back, brace core.','Sit down and back to depth.','Drive up through mid-foot.']::text[],ARRAY['Knees caving inward.','Heels rising off the floor.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'front-squat','Front Squat','Front-loaded squat emphasizing the quads and core.',(select id from muscles where slug='quads'),'advanced',4,false,ARRAY['Rack the bar on the front delts.','Keep elbows high, squat down.','Drive up staying upright.']::text[],ARRAY['Dropping the elbows and rounding forward.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'goblet-squat','Goblet Squat','Beginner squat holding a dumbbell at the chest.',(select id from muscles where slug='quads'),'beginner',2,false,ARRAY['Hold a dumbbell at chest height.','Squat between your knees.','Stand back up.']::text[],ARRAY['Leaning too far forward.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-press','Leg Press','Machine compound for quads and glutes.',(select id from muscles where slug='quads'),'beginner',2,false,ARRAY['Feet shoulder-width on the platform.','Lower until knees reach ~90 degrees.','Press without locking out hard.']::text[],ARRAY['Letting the lower back round off the pad.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'walking-lunge','Walking Lunge','Unilateral leg movement for quads and glutes.',(select id from muscles where slug='quads'),'beginner',2,false,ARRAY['Step forward and lower the back knee.','Push off to the next step.','Keep the torso upright.']::text[],ARRAY['Letting the front knee cave in.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'bulgarian-split-squat','Bulgarian Split Squat','Rear-foot-elevated single-leg squat.',(select id from muscles where slug='quads'),'intermediate',3,false,ARRAY['Rear foot on a bench.','Lower straight down.','Drive up through the front heel.']::text[],ARRAY['Leaning too far and losing balance.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-curl','Leg Curl','Machine isolation for the hamstrings.',(select id from muscles where slug='hamstrings'),'beginner',1,false,ARRAY['Adjust the pad above the heels.','Curl toward the glutes.','Lower slowly.']::text[],ARRAY['Using momentum.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'leg-extension','Leg Extension','Machine isolation for the quadriceps.',(select id from muscles where slug='quads'),'beginner',1,false,ARRAY['Pad on the lower shins.','Extend the knees fully.','Lower with control.']::text[],ARRAY['Swinging the weight.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hip-thrust','Hip Thrust','Glute-focused hip extension.',(select id from muscles where slug='glutes'),'beginner',2,false,ARRAY['Upper back on a bench, bar over hips.','Drive hips up to full extension.','Lower under control.']::text[],ARRAY['Overextending the lower back at the top.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'standing-calf-raise','Standing Calf Raise','Calf isolation through a full range.',(select id from muscles where slug='calves'),'beginner',1,false,ARRAY['Balls of feet on a step.','Raise onto the toes fully.','Lower for a deep stretch.']::text[],ARRAY['Using a tiny range of motion.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'seated-calf-raise','Seated Calf Raise','Bent-knee calf raise targeting the soleus.',(select id from muscles where slug='calves'),'beginner',1,false,ARRAY['Pad on the lower thighs.','Raise the heels fully.','Lower slowly.']::text[],ARRAY['Bouncing the weight.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'barbell-curl','Barbell Curl','Classic biceps mass builder.',(select id from muscles where slug='biceps'),'beginner',2,false,ARRAY['Grip shoulder-width, elbows tucked.','Curl to the top.','Lower fully.']::text[],ARRAY['Swinging with the lower back.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dumbbell-curl','Dumbbell Curl','Biceps curl allowing supination.',(select id from muscles where slug='biceps'),'beginner',1,false,ARRAY['Curl one or both dumbbells.','Rotate the pinky up at the top.','Lower slowly.']::text[],ARRAY['Using momentum.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hammer-curl','Hammer Curl','Neutral-grip curl for biceps and brachialis.',(select id from muscles where slug='biceps'),'beginner',1,false,ARRAY['Neutral grip, elbows tucked.','Curl up.','Lower under control.']::text[],ARRAY['Swinging the weight.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'tricep-pushdown','Triceps Pushdown','Cable isolation for the triceps.',(select id from muscles where slug='triceps'),'beginner',1,false,ARRAY['Elbows pinned to the sides.','Extend down fully.','Return with control.']::text[],ARRAY['Letting the elbows flare forward.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'overhead-tricep-extension','Overhead Triceps Extension','Overhead extension biasing the long head.',(select id from muscles where slug='triceps'),'beginner',2,false,ARRAY['Hold weight overhead.','Lower behind the head.','Extend back up.']::text[],ARRAY['Flaring the elbows out.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'close-grip-bench-press','Close-Grip Bench Press','Bench variation emphasizing the triceps.',(select id from muscles where slug='triceps'),'intermediate',3,false,ARRAY['Grip inside shoulder width.','Lower to the lower chest, elbows tucked.','Press up.']::text[],ARRAY['Gripping too narrow and stressing the wrists.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'dips-triceps','Triceps Dips','Upright dips emphasizing the triceps.',(select id from muscles where slug='triceps'),'intermediate',3,true,ARRAY['Stay upright on parallel bars.','Lower to ~90 degrees.','Press back up.']::text[],ARRAY['Leaning forward (shifts to chest).']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'wrist-curl','Wrist Curl','Forearm flexor isolation.',(select id from muscles where slug='forearms'),'beginner',1,false,ARRAY['Forearms on the thighs, palms up.','Curl the wrists up.','Lower slowly.']::text[],ARRAY['Using too heavy a load.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'plank','Plank','Isometric core stability hold.',(select id from muscles where slug='abs'),'beginner',1,true,ARRAY['Forearms down, body straight.','Brace the abs and glutes.','Hold for time.']::text[],ARRAY['Letting the hips sag or pike.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'side-plank','Side Plank','Lateral core and oblique hold.',(select id from muscles where slug='obliques'),'beginner',2,true,ARRAY['On one forearm, body straight sideways.','Lift the hips.','Hold, then switch sides.']::text[],ARRAY['Letting the hips drop.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'hanging-leg-raise','Hanging Leg Raise','Lower-ab exercise from a bar.',(select id from muscles where slug='abs'),'intermediate',3,true,ARRAY['Hang from a bar.','Raise the legs to hip height or higher.','Lower under control.']::text[],ARRAY['Swinging for momentum.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'crunch','Crunch','Basic abdominal flexion.',(select id from muscles where slug='abs'),'beginner',1,true,ARRAY['Lie down, knees bent.','Curl the shoulders off the floor.','Lower slowly.']::text[],ARRAY['Pulling on the neck.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'cable-woodchop','Cable Woodchop','Rotational core movement with a cable.',(select id from muscles where slug='obliques'),'beginner',2,false,ARRAY['Set the cable high or low.','Rotate across the body.','Return with control.']::text[],ARRAY['Rotating from the lower back instead of the core.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'russian-twist','Russian Twist','Seated rotational oblique exercise.',(select id from muscles where slug='obliques'),'beginner',1,true,ARRAY['Sit with the torso leaning back.','Rotate side to side.','Keep the core braced.']::text[],ARRAY['Moving the arms without rotating the torso.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'kettlebell-swing','Kettlebell Swing','Explosive hip-hinge conditioning movement.',(select id from muscles where slug='glutes'),'beginner',2,false,ARRAY['Hinge and hike the bell back.','Snap the hips to swing to chest height.','Let it fall and repeat.']::text[],ARRAY['Squatting instead of hinging.','Lifting with the arms.']::text[] on conflict (slug) do nothing;
insert into exercises (slug,name,description,primary_muscle_id,level,difficulty,is_bodyweight,instructions,common_mistakes) select 'band-pull-apart','Band Pull-Apart','Upper-back and rear-delt activation with a band.',(select id from muscles where slug='rear_delts'),'beginner',1,false,ARRAY['Hold a band at shoulder height.','Pull it apart to the chest.','Return with control.']::text[],ARRAY['Shrugging the shoulders.']::text[] on conflict (slug) do nothing;

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

do $s$ begin raise notice 'PART 2 OK — exercises=%', (select count(*) from exercises); end $s$;
commit;
