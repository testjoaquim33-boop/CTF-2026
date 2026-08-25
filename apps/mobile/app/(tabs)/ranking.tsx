import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, RankBadge, FilterChips, ExerciseThumb, muscleColor } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { fetchMyEntries, submitToLeaderboard, fetchPublicLeaderboard } from '../../src/services/ranking';
import { MUSCLE_GROUPS } from '../../src/features/exercises/groups';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

export default function RankingScreen() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const [group, setGroup] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const exercises = useExercises({ muscleGroup: group, search });
  const my = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });
  const [busy, setBusy] = useState<string | null>(null);
  const groups = MUSCLE_GROUPS.map((g) => ({ id: g.id, label: tr(`mg.${g.id}`) }));

  const publish = async (exerciseId: string) => {
    setBusy(exerciseId);
    const res = await submitToLeaderboard(exerciseId);
    setBusy(null);
    if (!res.ok) {
      const key = `rk.err.${res.error ?? ''}`;
      const msg = tr(key);
      Alert.alert(tr('rk.cantPublish'), msg !== key ? msg : (res.error ?? tr('common.error')));
      return;
    }
    Alert.alert(tr('rk.published'), res.rank ? tr('rk.rank', { rank: res.rank }) : tr('rk.scorePublished'));
    my.refetch();
  };
  const rankOf = (exId: string) => my.data?.find((e) => e.exercise_id === exId)?.rankSlug ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md, gap: t.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
            backgroundColor: t.colors.rank.gold + '22', borderWidth: 1, borderColor: t.colors.rank.gold + '55' }}>
            <Ionicons name="trophy" size={20} color={t.colors.rank.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 30, lineHeight: 34, fontWeight: '900', color: t.colors.text, letterSpacing: -0.8 }}>{tr('rk.title')}</Text>
          </View>
        </View>
        <Text color="textSecondary">{tr('rk.subtitle')}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.bgInput,
          borderRadius: t.radius.md, paddingHorizontal: t.spacing.md, borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="search" size={18} color={t.colors.textMuted} />
          <TextInput placeholder={tr('rk.search')} placeholderTextColor={t.colors.textMuted}
            value={search} onChangeText={setSearch}
            style={{ flex: 1, color: t.colors.text, paddingVertical: t.spacing.md, fontSize: 15 }} />
        </View>
        <FilterChips options={groups} value={group} onChange={setGroup} />
      </View>

      {exercises.isLoading ? <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.xl }} /> : (
        <FlatList
          data={exercises.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: t.spacing.sm, paddingBottom: t.spacing.xxl }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const mc = muscleColor(t.colors, item.primary_muscle?.group);
            return (
              <View style={{ backgroundColor: t.colors.bgCard, borderRadius: 20, padding: t.spacing.md,
                marginBottom: t.spacing.md, borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                  <ExerciseThumb group={item.primary_muscle?.group} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" numberOfLines={1}>{exName(item)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: mc }} />
                      <Text variant="caption" color="textSecondary">{item.primary_muscle?.name ?? '—'}</Text>
                    </View>
                  </View>
                  <RankBadge slug={rankOf(item.id)} />
                </View>

                <Pressable onPress={() => publish(item.id)} disabled={busy === item.id}
                  style={{ borderRadius: t.radius.md, overflow: 'hidden', opacity: busy === item.id ? 0.7 : 1 }}>
                  <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    {busy === item.id ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <Ionicons name="cloud-upload" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{tr('rk.publish')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <PublicList exerciseId={item.id} />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function PublicList({ exerciseId }: { exerciseId: string }) {
  const t = useTheme();
  const tr = useT();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['public-lb', exerciseId], queryFn: () => fetchPublicLeaderboard(exerciseId), enabled: open });
  const podium = [t.colors.rank.gold, t.colors.rank.silver, t.colors.rank.bronze];
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 2 }}>
        <Ionicons name={open ? 'chevron-up' : 'podium-outline'} size={15} color={t.colors.primary} />
        <Text color="primary" variant="caption" style={{ fontWeight: '700' }}>{open ? tr('rk.hideLb') : tr('rk.viewLb')}</Text>
      </Pressable>
      {open ? (
        q.isLoading ? <ActivityIndicator color={t.colors.primary} /> :
        (q.data ?? []).length === 0 ? <Text color="textMuted" variant="caption" style={{ textAlign: 'center', paddingVertical: 6 }}>{tr('rk.nobody')}</Text> :
        <View style={{ marginTop: 6, gap: 4 }}>
          {(q.data ?? []).map((r, i) => {
            const medal = i < 3 ? podium[i] : t.colors.textMuted;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
                paddingHorizontal: 10, borderRadius: 12,
                backgroundColor: i < 3 ? medal + '14' : 'transparent' }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: i < 3 ? medal + '33' : t.colors.bgInput }}>
                  <Text variant="caption" style={{ fontWeight: '900', color: i < 3 ? medal : t.colors.textSecondary, fontSize: 11 }}>{i + 1}</Text>
                </View>
                <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>{r.display_name ?? tr('rk.anon')}</Text>
                <Text variant="caption" style={{ color: i < 3 ? medal : t.colors.textSecondary, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{r.best_score.toFixed(2)}×</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
