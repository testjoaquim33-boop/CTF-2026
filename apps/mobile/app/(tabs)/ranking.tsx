import React, { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, RankBadge } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { fetchMyEntries, submitToLeaderboard, fetchPublicLeaderboard } from '../../src/services/ranking';

const KEY_SLUGS = ['barbell-bench-press', 'back-squat', 'deadlift'];
const ERR: Record<string, string> = {
  no_data: 'Enregistre d\'abord une séance avec cet exercice.',
  implausible_weight: 'Valeur de charge invalide.',
  implausible_bodyweight: 'Renseigne ton poids de corps (onboarding).',
};

export default function RankingScreen() {
  const t = useTheme();
  const exercises = useExercises({});
  const my = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });
  const [busy, setBusy] = useState<string | null>(null);

  const keyExercises = (exercises.data ?? []).filter((e) => KEY_SLUGS.includes(e.slug));

  const publish = async (exerciseId: string) => {
    setBusy(exerciseId);
    const res = await submitToLeaderboard(exerciseId);
    setBusy(null);
    if (!res.ok) { Alert.alert('Impossible de publier', ERR[res.error ?? ''] ?? res.error ?? 'Erreur'); return; }
    Alert.alert('Publié !', res.rank ? `Rang: ${res.rank}` : 'Score publié');
    my.refetch();
  };

  const rankOf = (exId: string) => my.data?.find((e) => e.exercise_id === exId)?.rankSlug ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}
        refreshControl={<RefreshControl refreshing={my.isRefetching} onRefresh={my.refetch} tintColor={t.colors.primary} />}>
        <Text variant="h1">Classement</Text>
        <Text color="textSecondary">Classé sur la force relative (charge / poids de corps).</Text>

        {exercises.isLoading ? <ActivityIndicator color={t.colors.primary} /> : keyExercises.map((ex) => (
          <View key={ex.id} style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md, padding: t.spacing.lg,
            borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="h3">{ex.name}</Text>
              <RankBadge slug={rankOf(ex.id)} />
            </View>
            <Button
              label={busy === ex.id ? 'Publication…' : 'Publier mon score'}
              onPress={() => publish(ex.id)} disabled={busy === ex.id}
            />
            <PublicList exerciseId={ex.id} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PublicList({ exerciseId }: { exerciseId: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['public-lb', exerciseId], queryFn: () => fetchPublicLeaderboard(exerciseId), enabled: open });
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)}>
        <Text color="primary" variant="caption">{open ? 'Masquer' : 'Voir le classement mondial'}</Text>
      </Pressable>
      {open ? (
        q.isLoading ? <ActivityIndicator color={t.colors.primary} /> :
        (q.data ?? []).length === 0 ? <Text color="textMuted" variant="caption">Personne pour l'instant</Text> :
        (q.data ?? []).map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text variant="caption">{i + 1}. {r.display_name ?? 'Anonyme'}</Text>
            <Text variant="caption" color="textSecondary">{r.best_score.toFixed(2)}×</Text>
          </View>
        ))
      ) : null}
    </View>
  );
}
