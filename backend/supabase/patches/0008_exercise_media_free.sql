-- ============================================================================
-- PROJECT_FIT — PATCH MEDIA EXERCICES (base libre free-exercise-db)
-- Source : github.com/yuhonas/free-exercise-db — licence Unlicense (domaine public,
-- usage commercial OK, aucune attribution requise). Images via CDN jsDelivr.
-- 2 images par exercice (depart / arrivee) -> l'app les alterne (animation).
-- A coller UNE fois dans le SQL Editor. Idempotent (update par slug).
-- ============================================================================

begin;

update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Arnold_Dumbbell_Press/0.jpg' where slug = 'arnold-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Squat/0.jpg' where slug = 'back-squat';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Band_Pull_Apart/0.jpg' where slug = 'band-pull-apart';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg' where slug = 'barbell-bench-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/0.jpg' where slug = 'barbell-curl';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/0.jpg' where slug = 'barbell-row';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Split_Squat_with_Dumbbells/0.jpg' where slug = 'bulgarian-split-squat';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/0.jpg' where slug = 'cable-fly';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Seated_Lateral_Raise/0.jpg' where slug = 'cable-lateral-raise';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Cable_Wood_Chop/0.jpg' where slug = 'cable-woodchop';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Chin-Up/0.jpg' where slug = 'chin-up';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Close-Grip_Barbell_Bench_Press/0.jpg' where slug = 'close-grip-bench-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Crunches/0.jpg' where slug = 'crunch';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Deadlift/0.jpg' where slug = 'deadlift';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/0.jpg' where slug = 'dips-chest';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Triceps_Version/0.jpg' where slug = 'dips-triceps';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bench_Press/0.jpg' where slug = 'dumbbell-bench-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Bicep_Curl/0.jpg' where slug = 'dumbbell-curl';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Flyes/0.jpg' where slug = 'dumbbell-fly';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/0.jpg' where slug = 'dumbbell-row';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dumbbell_Shoulder_Press/0.jpg' where slug = 'dumbbell-shoulder-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/0.jpg' where slug = 'face-pull';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Barbell_Squat/0.jpg' where slug = 'front-squat';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/0.jpg' where slug = 'goblet-squat';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hammer_Curls/0.jpg' where slug = 'hammer-curl';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/0.jpg' where slug = 'hanging-leg-raise';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Hip_Thrust/0.jpg' where slug = 'hip-thrust';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg' where slug = 'incline-barbell-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg' where slug = 'incline-dumbbell-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Push-Up/0.jpg' where slug = 'incline-push-up';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Kettlebell_Swings/0.jpg' where slug = 'kettlebell-swing';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Wide-Grip_Lat_Pulldown/0.jpg' where slug = 'lat-pulldown';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg' where slug = 'lateral-raise';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/0.jpg' where slug = 'leg-curl';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/0.jpg' where slug = 'leg-extension';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg' where slug = 'leg-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Barbell_Military_Press/0.jpg' where slug = 'overhead-press';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Rope_Overhead_Triceps_Extension/0.jpg' where slug = 'overhead-tricep-extension';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/0.jpg' where slug = 'plank';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/0.jpg' where slug = 'pull-up';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg' where slug = 'push-up';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Reverse_Flyes/0.jpg' where slug = 'rear-delt-fly';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg' where slug = 'romanian-deadlift';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/0.jpg' where slug = 'russian-twist';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg' where slug = 'seated-cable-row';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Calf_Raise/0.jpg' where slug = 'seated-calf-raise';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Bridge/0.jpg' where slug = 'side-plank';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Barbell_Calf_Raise/0.jpg' where slug = 'standing-calf-raise';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Trap_Bar_Deadlift/0.jpg' where slug = 'trap-bar-deadlift';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/0.jpg' where slug = 'tricep-pushdown';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Walking_Lunge/0.jpg' where slug = 'walking-lunge';
update exercises set image_url = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg' where slug = 'wrist-curl';

commit;
