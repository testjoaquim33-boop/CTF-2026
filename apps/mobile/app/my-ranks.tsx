import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text } from '../src/components';
import { fetchMyEntries, recomputeMyRanks, type MyEntry } from '../src/services/ranking';
import { useT } from '../src/i18n/useT';
import { useLocalized } from '../src/i18n/useLocalized';

/** Ordre & métadonnées des rangs (du plus bas au plus haut). */
const RANK_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'] as const;
const RANK_EMOJI: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '🔷', elite: '👑',
};
const rankTier = (slug: string | null) => (slug ? RANK_ORDER.indexOf(slug as typeof RANK_ORDER[number]) : -1);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function MyRanksScreen() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });
  const [computing, setComputing] = useState(false);

  const recompute = async () => {
    setComputing(true);
    const res = await recomputeMyRanks();
    setComputing(false);
    await refetch();
    if (res.ranked === 0) {
      Alert.alert(tr('ranks.title'), tr('ranks.recomputeNone'));
    }
  };

  const ranked = (data ?? [])
    .filter((e) => e.rankSlug)
    .sort((a, b) => rankTier(b.rankSlug) - rankTier(a.rankSlug) || b.best_score - a.best_score);
  const best = ranked[0] ?? null;
  const rankColor = (slug: string | null) => (slug ? t.colors.rank[slug as keyof typeof t.colors.rank] : t.colors.textMuted);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: t.colors.text, letterSpacing: -0.5 }}>{tr('ranks.title')}</Text>
        <Pressable onPress={recompute} disabled={computing} hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
            backgroundColor: t.colors.primary + '22', borderWidth: 1, borderColor: t.colors.primary + '55' }}>
          {computing ? <ActivityIndicator size="small" color={t.colors.primary} />
            : <Ionicons name="refresh" size={15} color={t.colors.primary} />}
          <Text style={{ color: t.colors.primary, fontWeight: '800', fontSize: 12 }}>{tr('ranks.recompute')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.colors.primary} />}>
        {isLoading ? <ActivityIndicator color={t.colors.primary} style={{ marginTop: 24 }} /> : (
          ranked.length === 0 ? (
            <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.colors.primary + '1A', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trophy-outline" size={30} color={t.colors.primary} />
              </View>
              <Text variant="h3" style={{ textAlign: 'center' }}>{tr('ranks.emptyTitle')}</Text>
              <Text color="textSecondary" style={{ textAlign: 'center' }}>{tr('ranks.emptyBody')}</Text>
              <Pressable onPress={() => router.push('/(tabs)/workout')} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 4 }}>
                <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 13, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="barbell" size={17} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '900' }}>{tr('ranks.startWorkout')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Hero : meilleur rang */}
              {best ? (
                <View style={{ borderRadius: 24, overflow: 'hidden' }}>
                  <LinearGradient colors={[rankColor(best.rankSlug) + '55', t.colors.bgCard]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={{ padding: 22, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: rankColor(best.rankSlug) + '66', borderRadius: 24 }}>
                    <Text style={{ fontSize: 56 }}>{RANK_EMOJI[best.rankSlug!] ?? '🏆'}</Text>
                    <Text style={{ fontSize: 26, fontWeight: '900', color: rankColor(best.rankSlug), letterSpacing: -0.5 }}>{capitalize(best.rankSlug!)}</Text>
                    <Text color="textSecondary" style={{ textAlign: 'center' }}>{tr('ranks.bestOn', { ex: exName(best) })}</Text>
                    <Text variant="caption" color="textMuted">{tr('ranks.rankedCount', { n: ranked.length })}</Text>
                  </LinearGradient>
                </View>
              ) : null}

              {/* Liste des rangs par exercice */}
              {ranked.map((e) => <RankRow key={e.exercise_id} entry={e} color={rankColor(e.rankSlug)} name={exName(e)} tr={tr} />)}
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RankRow({ entry, color, name, tr }: { entry: MyEntry; color: string; name: string; tr: (k: string, v?: Record<string, string | number>) => string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.colors.bgCard,
      borderRadius: 18, padding: 14, borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: color }}>
      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>{RANK_EMOJI[entry.rankSlug!] ?? '🏆'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" numberOfLines={1}>{name}</Text>
        <Text variant="caption" color="textSecondary">
          {tr('ranks.relative', { x: entry.best_score.toFixed(2) })}
          {entry.best_e1rm ? ` · ${tr('ranks.e1rm', { v: entry.best_e1rm })}` : ''}
        </Text>
      </View>
      <Text style={{ fontWeight: '900', color, fontSize: 13 }}>{capitalize(entry.rankSlug!)}</Text>
    </View>
  );
}
