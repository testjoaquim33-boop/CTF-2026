import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, muscleColor } from '../../src/components';
import { useExercise } from '../../src/hooks/useExercises';
import { fetchExerciseHistory, fetchExerciseRecords } from '../../src/services/exercises';
import { fetchPublicLeaderboard } from '../../src/services/ranking';
import { useT } from '../../src/i18n/useT';
import { useSettings } from '../../src/store/settings';
import { useLocalized } from '../../src/i18n/useLocalized';

const GROUP_EMOJI: Record<string, string> = {
  push: '🔥', pull: '🎯', legs: '🦵', core: '🧱', posterior: '⚡', arms: '💪',
};
const TAB_IDS = ['summary', 'history', 'instructions', 'ranking'] as const;
type Tab = typeof TAB_IDS[number];

function frDate(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExerciseDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tr = useT();
  const { exName } = useLocalized();
  const { data, isLoading } = useExercise(id ?? '');
  const [tab, setTab] = useState<Tab>('summary');

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.colors.primary} /></SafeAreaView>;
  }
  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.lg }}>
        <Text color="danger">{tr('ex.notFound')}</Text>
        <Button label={tr('common.back')} variant="secondary" onPress={() => router.back()} style={{ marginTop: t.spacing.lg }} />
      </SafeAreaView>
    );
  }

  const mc = muscleColor(t.colors, data.primary_muscle?.group);
  const group = data.primary_muscle?.group ?? 'push';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <Text variant="h3" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>{exName(data)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: t.spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* MÉDIA (anime GIF/WebP automatiquement ; fallback emoji) */}
        <Hero imageUrl={data.image_url} emoji={GROUP_EMOJI[group] ?? '💪'} />

        <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
          <Text variant="h1">{exName(data)}</Text>
          <Text color="textSecondary">{tr('ex.primary')} <Text style={{ color: mc }}>{data.primary_muscle?.name ?? '—'}</Text></Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap', marginTop: 2 }}>
            <Chip color={t.colors.info} label={tr(`onb.lvl.${data.level}`)} />
            {data.is_bodyweight ? <Chip color={t.colors.success} label={tr('ex.bodyweight')} /> : null}
          </View>
        </View>

        {/* TABS */}
        <View style={{ flexDirection: 'row', gap: 6, marginHorizontal: t.spacing.lg, marginBottom: t.spacing.sm,
          backgroundColor: t.colors.bgCard, borderRadius: t.radius.pill, padding: 4, borderWidth: 1, borderColor: t.colors.border }}>
          {TAB_IDS.map((id2) => {
            const active = tab === id2;
            return (
              <Pressable key={id2} onPress={() => setTab(id2)}
                style={{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: t.radius.pill,
                  backgroundColor: active ? t.colors.primary : 'transparent' }}>
                <Text variant="caption" style={{ color: active ? '#fff' : t.colors.textMuted, fontWeight: active ? '900' : '700', fontSize: 12 }}>{tr(`ex.tab.${id2}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ padding: t.spacing.lg }}>
          {tab === 'summary' ? <ResumeTab data={data} exerciseId={id!} /> : null}
          {tab === 'history' ? <HistoryTab exerciseId={id!} /> : null}
          {tab === 'instructions' ? <InstructionsTab data={data} mc={mc} /> : null}
          {tab === 'ranking' ? <RankingTab exerciseId={id!} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Média de démonstration. Si l'URL pointe vers une image « .../0.jpg » (base
 * free-exercise-db), on précharge aussi « .../1.jpg » et on alterne les deux
 * frames (position départ ↔ arrivée) pour animer le mouvement. Fallback statique
 * si la 2e frame manque, emoji si l'image échoue. Anime aussi nativement un
 * GIF/WebP animé si image_url en pointe un.
 */
function Hero({ imageUrl, emoji }: { imageUrl: string | null; emoji: string }) {
  const [err0, setErr0] = React.useState(false);
  const [err1, setErr1] = React.useState(false);
  const [showFirst, setShowFirst] = React.useState(true);

  const frame1 = imageUrl && imageUrl.includes('/0.jpg') ? imageUrl.replace('/0.jpg', '/1.jpg') : null;
  const animated = !!frame1 && !err1;

  React.useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setShowFirst((s) => !s), 900);
    return () => clearInterval(id);
  }, [animated]);

  const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, width: '100%' as const, height: '100%' as const };

  return (
    <View style={{ height: 260, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      {!imageUrl || err0 ? (
        <Text style={{ fontSize: 96 }}>{emoji}</Text>
      ) : (
        <>
          <Image source={{ uri: imageUrl }} onError={() => setErr0(true)} resizeMode="contain"
            style={[fill, { opacity: !animated || showFirst ? 1 : 0 }]} />
          {frame1 ? (
            <Image source={{ uri: frame1 }} onError={() => setErr1(true)} resizeMode="contain"
              style={[fill, { opacity: animated && !showFirst ? 1 : 0 }]} />
          ) : null}
        </>
      )}
    </View>
  );
}

function ResumeTab({ data, exerciseId }: { data: NonNullable<ReturnType<typeof useExercise>['data']>; exerciseId: string }) {
  const t = useTheme();
  const tr = useT();
  const { pick } = useLocalized();
  const records = useQuery({ queryKey: ['ex-records', exerciseId], queryFn: () => fetchExerciseRecords(exerciseId) });
  const recs = records.data ?? [];
  const description = pick(data.description, data.description_fr);
  return (
    <View style={{ gap: t.spacing.md }}>
      {description ? <Text>{description}</Text> : null}

      {data.video_url ? (
        <Button label={tr('ex.video')} variant="secondary" onPress={() => Linking.openURL(data.video_url!)} />
      ) : null}

      <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.lg,
        borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: t.colors.warning }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: t.spacing.sm }}>
          <Text style={{ fontSize: 18 }}>🏅</Text>
          <Text variant="h3">{tr('ex.records')}</Text>
        </View>
        {records.isLoading ? <ActivityIndicator color={t.colors.primary} /> :
          recs.length === 0 ? <Text color="textMuted" variant="caption">{tr('ex.noRecords')}</Text> :
          recs.map((r) => (
            <View key={r.type} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
              <Text color="textSecondary">{tr(`pr.${r.type}`) !== `pr.${r.type}` ? tr(`pr.${r.type}`) : r.type}</Text>
              <Text variant="bodyMedium" style={{ color: t.colors.primary }}>{r.value} {r.unit}</Text>
            </View>
          ))}
      </View>

      <Button label={tr('ex.askCoach')} onPress={() => router.push(`/coach/${exerciseId}`)} />
    </View>
  );
}

function HistoryTab({ exerciseId }: { exerciseId: string }) {
  const t = useTheme();
  const tr = useT();
  const locale = useSettings((s) => s.lang) === 'en' ? 'en-US' : 'fr-FR';
  const q = useQuery({ queryKey: ['ex-history', exerciseId], queryFn: () => fetchExerciseHistory(exerciseId) });
  if (q.isLoading) return <ActivityIndicator color={t.colors.primary} />;
  const days = q.data ?? [];
  if (days.length === 0) return <Text color="textMuted">{tr('ex.noHistory')}</Text>;
  return (
    <View style={{ gap: t.spacing.md }}>
      {days.map((day) => (
        <View key={day.date} style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.md, borderWidth: 1, borderColor: t.colors.border }}>
          <Text variant="bodyMedium" style={{ marginBottom: 6 }}>{frDate(day.date, locale)}</Text>
          {day.sets.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text color="textSecondary" variant="caption">{tr('ex.set', { n: i + 1 })}{s.isWarmup ? tr('ex.warmup') : ''}</Text>
              <Text variant="caption">{s.weightKg} kg × {s.reps}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function InstructionsTab({ data, mc }: { data: NonNullable<ReturnType<typeof useExercise>['data']>; mc: string }) {
  const t = useTheme();
  const tr = useT();
  const { pick } = useLocalized();
  const instructions = pick(data.instructions, data.instructions_fr) ?? [];
  const mistakes = pick(data.common_mistakes, data.common_mistakes_fr) ?? [];
  return (
    <View style={{ gap: t.spacing.md }}>
      {instructions.length ? (
        <View style={{ gap: t.spacing.sm }}>
          {instructions.map((ins, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: mc + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="caption" style={{ color: mc, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1 }}>{ins}</Text>
            </View>
          ))}
        </View>
      ) : <Text color="textMuted">{tr('ex.noInstructions')}</Text>}

      {mistakes.length ? (
        <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.lg,
          borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: t.colors.warning, marginTop: t.spacing.sm }}>
          <Text variant="h3" style={{ marginBottom: t.spacing.sm }}>{tr('ex.mistakes')}</Text>
          {mistakes.map((m, i) => (
            <Text key={i} color="textSecondary" style={{ marginBottom: 4 }}>• {m}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RankingTab({ exerciseId }: { exerciseId: string }) {
  const t = useTheme();
  const tr = useT();
  const q = useQuery({ queryKey: ['ex-lb', exerciseId], queryFn: () => fetchPublicLeaderboard(exerciseId) });
  if (q.isLoading) return <ActivityIndicator color={t.colors.primary} />;
  const rows = q.data ?? [];
  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text color="textSecondary" variant="caption">{tr('ex.rankIntro')}</Text>
      {rows.length === 0 ? (
        <Text color="textMuted" style={{ marginTop: t.spacing.sm }}>{tr('ex.rankEmpty')}</Text>
      ) : rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: t.colors.bgCard, borderRadius: t.radius.sm, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm,
          borderWidth: 1, borderColor: t.colors.border }}>
          <Text variant="bodyMedium" style={{ width: 30, color: i < 3 ? t.colors.primary : t.colors.textMuted }}>{i + 1}</Text>
          <Text style={{ flex: 1 }} numberOfLines={1}>{r.display_name ?? 'Anonyme'}</Text>
          <Text variant="bodyMedium" color="textSecondary">{r.best_score.toFixed(2)}×</Text>
        </View>
      ))}
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: t.spacing.md, paddingVertical: 4, borderRadius: t.radius.pill,
      backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55' }}>
      <Text variant="caption" style={{ color }}>{label}</Text>
    </View>
  );
}
