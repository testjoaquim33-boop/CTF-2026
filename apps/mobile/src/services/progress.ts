import { supabase } from './supabase';
import type { PersonalRecordType } from '@project_fit/shared';

export interface BodyPoint { date: string; weightKg: number }
export interface PRRow {
  exerciseName: string; type: PersonalRecordType; value: number; unit: string; achievedAt: string;
}
export interface ProgressSummary {
  workoutCount: number;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  bodySeries: BodyPoint[];
  recentPRs: PRRow[];
}

export async function fetchProgressSummary(): Promise<ProgressSummary> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('not_authenticated');

  const [countRes, bodyRes, goalRes, prRes] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed'),
    supabase.from('body_metrics').select('date,weight_kg')
      .eq('user_id', userId).order('date', { ascending: true }).limit(30),
    supabase.from('goals').select('target_weight_kg').eq('user_id', userId).eq('active', true).maybeSingle(),
    supabase.from('personal_records')
      .select('type,value,unit,achieved_at,exercise:exercises!exercise_id(name)')
      .eq('user_id', userId).order('achieved_at', { ascending: false }).limit(10),
  ]);

  const bodySeries: BodyPoint[] = (bodyRes.data ?? []).map((r) => ({ date: r.date, weightKg: Number(r.weight_kg) }));
  const recentPRs: PRRow[] = (prRes.data ?? []).map((r) => ({
    exerciseName: (r as unknown as { exercise?: { name?: string } }).exercise?.name ?? '—',
    type: r.type as PersonalRecordType,
    value: Number(r.value),
    unit: r.unit as string,
    achievedAt: r.achieved_at as string,
  }));

  return {
    workoutCount: countRes.count ?? 0,
    currentWeightKg: bodySeries.length ? bodySeries[bodySeries.length - 1].weightKg : null,
    targetWeightKg: goalRes.data?.target_weight_kg != null ? Number(goalRes.data.target_weight_kg) : null,
    bodySeries,
    recentPRs,
  };
}
