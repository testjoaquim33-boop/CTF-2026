import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text } from '../../src/components';
import { fetchDashboard, type Dashboard } from '../../src/services/dashboard';

const PR_LABELS: Record<string, string> = {
  est_1rm: '1RM est.', max_weight: 'Charge', max_reps: 'Reps', max_volume: 'Volume',
};
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Dashboard_() {
  const t = useTheme();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.colors.primary} /></SafeAreaView>;
  }
  const d = data as Dashboard;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: t.spacing.xxl }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="h1">Bonjour 👋</Text>
            <Text color="textSecondary">Prêt à progresser aujourd'hui ?</Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.primary,
            alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="bodyMedium" color="onPrimary">{d.level}</Text>
          </View>
        </View>

        {/* HERO niveau */}
        <View style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.lg, padding: t.spacing.lg, gap: t.spacing.xs,
          shadowColor: t.colors.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
          <Text variant="overline" style={{ color: '#FFFFFFAA' }}>NIVEAU {d.level} · {d.title.toUpperCase()}</Text>
          <View style={{ height: 8, backgroundColor: '#FFFFFF33', borderRadius: 999, marginTop: 4 }}>
            <View style={{ height: 8, width: `${Math.max(4, d.progress * 100)}%`, backgroundColor: '#FFFFFF', borderRadius: 999 }} />
          </View>
          <Text variant="caption" style={{ color: '#FFFFFFDD', marginTop: 4 }}>{d.xp} XP · 🔥 {d.streak} jours de streak</Text>
        </View>

        {/* CTA */}
        <Pressable onPress={() => router.push('/workout/new')}
          style={{ backgroundColor: t.colors.secondary, borderRadius: t.radius.lg, padding: t.spacing.lg,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text variant="overline" style={{ color: '#FFFFFFAA' }}>PROCHAINE SÉANCE</Text>
            <Text variant="h3" color="onPrimary">Démarrer une séance →</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🏋️</Text>
        </Pressable>

        {/* Stat tiles */}
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <StatTile label="Séances" value={String(d.totalWorkouts)} sub="total" color={t.colors.info} />
          <StatTile label="Cette semaine" value={String(d.weekWorkouts)} sub="séances" color={t.colors.success} />
          <StatTile label="Records" value={String(d.recentPRs.length)} sub="récents" color={t.colors.warning} />
        </View>

        {/* 7-day streak dots */}
        <Widget title="7 derniers jours">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: t.spacing.sm }}>
            {d.last7.map((day, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16,
                  backgroundColor: day.trained ? t.colors.primary : t.colors.bgInput,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                  borderColor: day.trained ? t.colors.primary : t.colors.border }}>
                  <Text variant="caption" color={day.trained ? 'onPrimary' : 'textMuted'}>{day.trained ? '✓' : ''}</Text>
                </View>
                <Text variant="caption" color="textMuted">{DAY_LETTERS[i]}</Text>
              </View>
            ))}
          </View>
        </Widget>

        {/* Weekly bars */}
        <Widget title="Séances par semaine">
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: t.spacing.sm, marginTop: t.spacing.sm }}>
            {d.weeks.map((w, i) => {
              const max = Math.max(1, ...d.weeks.map((x) => x.count));
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text variant="caption" color="textMuted">{w.count}</Text>
                  <View style={{ width: '70%', height: 8 + (w.count / max) * 60,
                    backgroundColor: i === d.weeks.length - 1 ? t.colors.primary : t.colors.secondary,
                    borderRadius: t.radius.sm }} />
                </View>
              );
            })}
          </View>
        </Widget>

        {/* Weight goal */}
        {d.currentWeightKg != null ? (
          <Widget title="Objectif poids">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.spacing.sm }}>
              <Text variant="h2">{d.currentWeightKg} kg</Text>
              <Text color="textSecondary">→ {d.targetWeightKg ?? '—'} kg</Text>
            </View>
            {d.targetWeightKg && d.startWeightKg && d.startWeightKg !== d.targetWeightKg ? (
              <WeightProgress start={d.startWeightKg} current={d.currentWeightKg} target={d.targetWeightKg} />
            ) : null}
          </Widget>
        ) : null}

        {/* Recent PRs */}
        <Widget title="Records récents">
          {d.recentPRs.length === 0 ? (
            <Text color="textMuted">Termine une séance pour décrocher tes premiers records 💪</Text>
          ) : d.recentPRs.map((pr, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text>{pr.exerciseName} <Text color="textMuted" variant="caption">({PR_LABELS[pr.type] ?? pr.type})</Text></Text>
              <Text color="primary" variant="bodyMedium">{pr.value} {pr.unit}</Text>
            </View>
          ))}
        </Widget>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <QuickAction label="🏆 Gym Card" onPress={() => router.push('/gym-card')} />
          <QuickAction label="📊 Progression" onPress={() => router.push('/(tabs)/progress')} />
          <QuickAction label="🥇 Classement" onPress={() => router.push('/(tabs)/ranking')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.md,
      borderWidth: 1, borderColor: t.colors.border, borderTopWidth: 3, borderTopColor: color }}>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color="textSecondary">{label}</Text>
      <Text variant="caption" color="textMuted">{sub}</Text>
    </View>
  );
}
function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg, padding: t.spacing.lg,
      borderWidth: 1, borderColor: t.colors.border }}>
      <Text variant="overline" color="textMuted">{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}
function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: t.colors.bgCard, borderRadius: t.radius.md,
      padding: t.spacing.md, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center' }}>
      <Text variant="caption">{label}</Text>
    </Pressable>
  );
}
function WeightProgress({ start, current, target }: { start: number; current: number; target: number }) {
  const t = useTheme();
  const total = Math.abs(target - start);
  const done = Math.abs(current - start);
  const pct = Math.max(0, Math.min(1, total === 0 ? 0 : done / total));
  return (
    <View style={{ height: 8, backgroundColor: t.colors.bgInput, borderRadius: 999 }}>
      <View style={{ height: 8, width: `${pct * 100}%`, backgroundColor: t.colors.success, borderRadius: 999 }} />
    </View>
  );
}
