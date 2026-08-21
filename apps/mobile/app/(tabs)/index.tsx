import React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, ProgressBar } from '../../src/components';
import { fetchHomeStats } from '../../src/services/gamification';
import { fetchProgressSummary } from '../../src/services/progress';

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg, padding: t.spacing.lg,
      borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm,
      ...(accent ? { borderLeftWidth: 4, borderLeftColor: accent } : {}) }}>{children}</View>
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

        {/* HERO NIVEAU — carte pleine couleur, accrocheuse */}
        <View style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.lg, padding: t.spacing.xl, gap: t.spacing.sm,
          shadowColor: t.colors.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
          <Text variant="overline" style={{ color: '#FFFFFFAA' }}>TON NIVEAU</Text>
          <Text variant="display" color="onPrimary">Niveau {home.data?.level}</Text>
          <Text variant="bodyMedium" color="onPrimary">{home.data?.title} · 🔥 {home.data?.streak ?? 0} jours</Text>
          <View style={{ height: 8, backgroundColor: '#FFFFFF33', borderRadius: 999, marginTop: t.spacing.sm }}>
            <View style={{ height: 8, width: `${(home.data?.progress ?? 0) * 100}%`, backgroundColor: '#FFFFFF', borderRadius: 999 }} />
          </View>
          <Text variant="caption" style={{ color: '#FFFFFFCC' }}>{home.data?.xp ?? 0} XP</Text>
        </View>

        <View style={{ backgroundColor: t.colors.secondary, borderRadius: t.radius.lg, padding: t.spacing.xl, gap: t.spacing.sm }}>
          <Text variant="overline" style={{ color: '#FFFFFFAA' }}>PROCHAINE SÉANCE</Text>
          <Text variant="h2" color="onPrimary">Prêt à t'entraîner ?</Text>
          <Button label="Démarrer une séance" variant="secondary" onPress={() => router.push('/workout/new')}
            style={{ marginTop: t.spacing.sm, backgroundColor: '#FFFFFF' }} />
        </View>

        <Card accent={t.colors.success}>
          <Text variant="overline" color="textMuted">TA PROGRESSION</Text>
          <Text variant="h3">{prog.data?.workoutCount ?? 0} séances · {prog.data?.recentPRs.length ?? 0} records</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
            <Button label="Progression" variant="secondary" onPress={() => router.push('/(tabs)/progress')} style={{ flex: 1 }} />
            <Button label="🏆 Gym Card" variant="secondary" onPress={() => router.push('/gym-card')} style={{ flex: 1 }} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
