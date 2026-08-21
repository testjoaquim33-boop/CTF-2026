import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, RankBadge, FilterChips, ExerciseThumb, muscleColor } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { fetchMyEntries, submitToLeaderboard, fetchPublicLeaderboard } from '../../src/services/ranking';
import { MUSCLE_GROUPS } from '../../src/features/exercises/groups';

const ERR: Record<string, string> = {
  no_data: 'Enregistre d\'abord une séance avec cet exercice.',
  implausible_weight: 'Valeur de charge invalide.',
  implausible_bodyweight: 'Renseigne ton poids de corps (onboarding).',
};

export default function RankingScreen() {
  const t = useTheme();
  const [group, setGroup] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const exercises = useExercises({ muscleGroup: group, search });
  const my = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });
  const [busy, setBusy] = useState<string | null>(null);

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
      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <Text variant="h1">Classement</Text>
        <Text color="textSecondary">Classé sur la force relative (charge / poids de corps). Publie n'importe quel exercice.</Text>
        <TextInput placeholder="Rechercher un exercice…" placeholderTextColor={t.colors.textMuted}
          value={search} onChangeText={setSearch}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md }} />
        <FilterChips options={MUSCLE_GROUPS} value={group} onChange={setGroup} />
      </View>

      {exercises.isLoading ? <ActivityIndicator color={t.colors.primary} /> : (
        <FlatList
          data={exercises.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
          renderItem={({ item }) => {
            const mc = muscleColor(t.colors, item.primary_muscle?.group);
            return (
              <View style={{ backgroundColor: t.colors.bgCard, borderRadius: t.radius.md, padding: t.spacing.md,
                marginBottom: t.spacing.md, borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: mc, gap: t.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                  <ExerciseThumb group={item.primary_muscle?.group} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{item.name}</Text>
                    <Text variant="caption" color="textSecondary">{item.primary_muscle?.name ?? '—'}</Text>
                  </View>
                  <RankBadge slug={rankOf(item.id)} />
                </View>
                <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                  <Pressable onPress={() => publish(item.id)} disabled={busy === item.id}
                    style={{ flex: 1, backgroundColor: t.colors.primary, borderRadius: t.radius.sm, paddingVertical: t.spacing.sm, alignItems: 'center' }}>
                    <Text color="onPrimary" variant="caption">{busy === item.id ? '…' : 'Publier mon score'}</Text>
                  </Pressable>
                </View>
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
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['public-lb', exerciseId], queryFn: () => fetchPublicLeaderboard(exerciseId), enabled: open });
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)}>
        <Text color="primary" variant="caption">{open ? 'Masquer le classement' : 'Voir le classement mondial'}</Text>
      </Pressable>
      {open ? (
        q.isLoading ? <ActivityIndicator color={t.colors.primary} /> :
        (q.data ?? []).length === 0 ? <Text color="textMuted" variant="caption">Personne pour l'instant — sois le premier !</Text> :
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
