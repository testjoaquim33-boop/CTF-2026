import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, ProgressBar } from '../../src/components';
import { fetchHomeStats } from '../../src/services/gamification';
import { fetchProgressSummary } from '../../src/services/progress';

function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
      borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>{children}</View>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const home = useQuery({ queryKey: ['home'], queryFn: fetchHomeStats });
  const prog = useQuery({ queryKey: ['progress'], queryFn: fetchProgressSummary });
  const loading = home.isLoading || prog.isLoading;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </SafeAreaView>
    );
  }

  const refetch = () => { home.refetch(); prog.refetch(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}
        refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>
        <Text variant="h1">Bonjour 👋</Text>

        <Card>
          <Text variant="overline" color="textMuted">TON NIVEAU</Text>
          <Text variant="h2" color="primary">Niveau {home.data?.level} · {home.data?.title}</Text>
          <ProgressBar progress={home.data?.progress ?? 0} />
          <Text variant="caption" color="textSecondary">{home.data?.xp ?? 0} XP · 🔥 {home.data?.streak ?? 0} jours de streak</Text>
        </Card>

        <Card>
          <Text variant="overline" color="textMuted">PROCHAINE SÉANCE</Text>
          <Text variant="h3">Commence quand tu veux</Text>
          <Button label="Démarrer une séance" onPress={() => router.push('/workout/new')} style={{ marginTop: t.spacing.sm }} />
        </Card>

        <Card>
          <Text variant="overline" color="textMuted">TA PROGRESSION</Text>
          <Text>{prog.data?.workoutCount ?? 0} séances · {prog.data?.recentPRs.length ?? 0} records récents</Text>
          <Button label="Voir la progression" variant="secondary" onPress={() => router.push('/(tabs)/progress')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
