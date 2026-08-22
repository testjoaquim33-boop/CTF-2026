import { supabase } from './supabase';
import { levelForXp, type LevelRow, type PersonalRecordType } from '@project_fit/shared';

export interface DayDot { date: string; trained: boolean }
export interface WeekBar { label: string; count: number }
export interface DashPR { exerciseName: string; type: PersonalRecordType; value: number; unit: string }

export interface Dashboard {
  displayName: string;
  weightSeries: number[];
  level: number; title: string; progress: number; xp: number; nextXp: number | null; streak: number;
  totalWorkouts: number;
  weekWorkouts: number;
  recentPRs: DashPR[];
  sessionMinutes: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  startWeightKg: number | null;
  last7: DayDot[];
  weeks: WeekBar[];
}

function ymd(d: Date): string { return d.toISOString().slice(0, 10); }
function startOfWeek(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day); return x;
}

export async function fetchDashboard(): Promise<Dashboard> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('not_authenticated');

  const since = new Date(); since.setUTCDate(since.getUTCDate() - 45);

  const [statsRes, levelsRes, workoutsRes, prRes, bodyRes, goalRes, profileRes] = await Promise.all([
    supabase.from('user_stats').select('xp,streak_days').eq('user_id', userId).maybeSingle(),
    supabase.from('levels').select('level,min_xp,title'),
    supabase.from('workouts').select('started_at').eq('user_id', userId).eq('status', 'completed')
      .gte('started_at', since.toISOString()).order('started_at', { ascending: false }),
    supabase.from('personal_records')
      .select('type,value,unit,exercise:exercises!exercise_id(name)')
      .eq('user_id', userId).order('achieved_at', { ascending: false }).limit(5),
    supabase.from('body_metrics').select('date,weight_kg').eq('user_id', userId).order('date', { ascending: true }),
    supabase.from('goals').select('target_weight_kg,session_minutes').eq('user_id', userId).eq('active', true).maybeSingle(),
    supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle(),
  ]);

  // total workouts (separate exact count)
  const totalRes = await supabase.from('workouts').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'completed');

  const xp = statsRes.data?.xp ?? 0;
  const levelRows: LevelRow[] = (levelsRes.data ?? []).map((l) => ({ level: l.level, minXp: l.min_xp, title: l.title }));
  const st = levelForXp(xp, levelRows);

  const workoutDates = new Set((workoutsRes.data ?? []).map((w) => (w.started_at as string).slice(0, 10)));

  // last 7 days dots
  const last7: DayDot[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - i);
    last7.push({ date: ymd(d), trained: workoutDates.has(ymd(d)) });
  }

  // sessions per week (last 6 weeks)
  const weeks: WeekBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const ws = startOfWeek(new Date()); ws.setUTCDate(ws.getUTCDate() - i * 7);
    const we = new Date(ws); we.setUTCDate(we.getUTCDate() + 7);
    const count = (workoutsRes.data ?? []).filter((w) => {
      const t = w.started_at as string; return t >= ws.toISOString() && t < we.toISOString();
    }).length;
    weeks.push({ label: `S-${i}`, count });
  }
  const weekWorkouts = weeks[weeks.length - 1]?.count ?? 0;

  const body = bodyRes.data ?? [];
  const recentPRs: DashPR[] = (prRes.data ?? []).map((r) => ({
    exerciseName: (r as unknown as { exercise?: { name?: string } }).exercise?.name ?? '—',
    type: r.type as PersonalRecordType, value: Number(r.value), unit: r.unit as string,
  }));

  const rawName = profileRes.data?.display_name ?? '';
  const displayName = (rawName.split(/[\s@]/)[0] || 'Champion');
  const weightSeries = body.map((b) => Number(b.weight_kg));

  return {
    displayName, weightSeries,
    level: st.level, title: st.title, progress: st.progress, xp, nextXp: st.nextMinXp, streak: statsRes.data?.streak_days ?? 0,
    totalWorkouts: totalRes.count ?? 0,
    weekWorkouts,
    recentPRs,
    currentWeightKg: body.length ? Number(body[body.length - 1].weight_kg) : null,
    startWeightKg: body.length ? Number(body[0].weight_kg) : null,
    sessionMinutes: goalRes.data?.session_minutes != null ? Number(goalRes.data.session_minutes) : null,
    targetWeightKg: goalRes.data?.target_weight_kg != null ? Number(goalRes.data.target_weight_kg) : null,
    last7, weeks,
  };
}
