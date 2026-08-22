import React from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text, ProgressBar, AmbientOrbs } from '../src/components';
import { fetchAchievements, type AchievementView } from '../src/services/achievements';

export default function AchievementsScreen() {
  const t = useTheme();
  const q = useQuery({ queryKey: ['achievements'], queryFn: fetchAchievements });

  const items = q.data?.items ?? [];
  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AmbientOrbs colors={[t.colors.primary, t.colors.secondary, t.colors.info]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.lg, paddingBottom: t.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h1">Badges</Text>
          {!q.isLoading ? (
            <Text variant="caption" color="textSecondary">{unlockedCount} / {items.length} débloqués</Text>
          ) : null}
        </View>
      </View>

      {q.isLoading ? (
        <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.xl }} />
      ) : q.isError ? (
        <View style={{ padding: t.spacing.lg }}>
          <Text color="danger">Impossible de charger les badges.</Text>
          <Text color="textMuted" variant="caption">
            Assure-toi d'avoir appliqué la migration 0006 et le seed 0004 sur Supabase.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}>
          {/* Barre de progression globale */}
          <View style={{ marginBottom: t.spacing.lg, gap: t.spacing.sm }}>
            <ProgressBar progress={items.length ? unlockedCount / items.length : 0} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {items.map((a) => <BadgeCard key={a.slug} a={a} />)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BadgeCard({ a }: { a: AchievementView }) {
  const t = useTheme();
  const tint = a.unlocked ? t.colors.primary : t.colors.textMuted;
  return (
    <View style={{
      width: '48%', marginBottom: t.spacing.md,
      backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg ?? t.radius.md,
      padding: t.spacing.lg, borderWidth: 1,
      borderColor: a.unlocked ? t.colors.primary + '66' : t.colors.border,
      opacity: a.unlocked ? 1 : 0.72,
      gap: t.spacing.sm,
    }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
        backgroundColor: a.unlocked ? t.colors.primary + '22' : t.colors.bgInput,
        borderWidth: 1, borderColor: a.unlocked ? t.colors.primary + '55' : t.colors.border,
      }}>
        <Text style={{ fontSize: 28, lineHeight: 34, opacity: a.unlocked ? 1 : 0.5 }}>
          {a.icon ?? '🏅'}
        </Text>
        {!a.unlocked ? (
          <View style={{ position: 'absolute', right: -2, bottom: -2, backgroundColor: t.colors.bgCard, borderRadius: 10 }}>
            <Ionicons name="lock-closed" size={16} color={t.colors.textMuted} />
          </View>
        ) : null}
      </View>

      <Text variant="bodyMedium" style={{ color: t.colors.text }} numberOfLines={1}>{a.name}</Text>
      {a.description ? (
        <Text variant="caption" color="textSecondary" numberOfLines={2}>{a.description}</Text>
      ) : null}

      {a.unlocked ? (
        <Text variant="overline" style={{ color: tint }}>DÉBLOQUÉ</Text>
      ) : (
        <View style={{ gap: 4 }}>
          <ProgressBar progress={a.progress} />
          <Text variant="caption" color="textMuted">{Math.round(a.progress * 100)}%</Text>
        </View>
      )}
    </View>
  );
}
