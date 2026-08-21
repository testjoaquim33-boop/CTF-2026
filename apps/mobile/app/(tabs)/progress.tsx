import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, MiniBarChart } from '../../src/components';
import { fetchProgressSummary } from '../../src/services/progress';

const PR_LABELS: Record<string, string> = {
  est_1rm: '1RM estimé', max_weight: 'Charge max', max_reps: 'Reps max', max_volume: 'Volume max',
};

function StatTile({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md,
      padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border }}>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color="textSecondary">{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const t = useTheme();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['progress'], queryFn: fetchProgressSummary,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}
      >
        <Text variant="h1">Progression</Text>

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <StatTile label="Séances" value={String(data?.workoutCount ?? 0)} />
          <StatTile label="Poids actuel" value={data?.currentWeightKg ? `${data.currentWeightKg} kg` : '—'} />
          <StatTile label="Objectif" value={data?.targetWeightKg ? `${data.targetWeightKg} kg` : '—'} />
        </View>

        <View style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border }}>
          <Text variant="h3" style={{ marginBottom: t.spacing.md }}>Poids corporel</Text>
          <MiniBarChart values={(data?.bodySeries ?? []).map((b) => b.weightKg)} />
        </View>

        <View>
          <Text variant="h3" style={{ marginBottom: t.spacing.md }}>Records récents</Text>
          {(data?.recentPRs ?? []).length === 0 ? (
            <Text color="textMuted">Termine une séance pour décrocher tes premiers records 💪</Text>
          ) : (
            data!.recentPRs.map((pr, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between',
                backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.md,
                marginBottom: t.spacing.sm, borderWidth: 1, borderColor: t.colors.border }}>
                <View>
                  <Text variant="bodyMedium">{pr.exerciseName}</Text>
                  <Text variant="caption" color="textSecondary">{PR_LABELS[pr.type] ?? pr.type}</Text>
                </View>
                <Text variant="bodyMedium" color="primary">{pr.value} {pr.unit}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
