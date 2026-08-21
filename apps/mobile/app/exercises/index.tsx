import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, FilterChips } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { MUSCLE_GROUPS, LEVEL_LABELS_SHORT } from '../../src/features/exercises/groups';
import type { Level } from '@project_fit/shared';

const LEVELS = [
  { id: 'beginner' as Level, label: 'Débutant' },
  { id: 'intermediate' as Level, label: 'Intermédiaire' },
  { id: 'advanced' as Level, label: 'Avancé' },
];

export default function ExerciseListScreen() {
  const t = useTheme();
  const [group, setGroup] = useState<string | undefined>();
  const [level, setLevel] = useState<Level | undefined>();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useExercises({ muscleGroup: group, level, search });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <Text variant="h1">Exercices</Text>
        <TextInput
          placeholder="Rechercher…"
          placeholderTextColor={t.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text,
            borderRadius: t.radius.md, padding: t.spacing.md, fontSize: 15 }}
        />
        <FilterChips options={MUSCLE_GROUPS} value={group} onChange={setGroup} />
        <FilterChips options={LEVELS} value={level} onChange={setLevel} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.xl }} />
      ) : error ? (
        <Text color="danger" style={{ padding: t.spacing.lg }}>Erreur de chargement</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
          ListEmptyComponent={<Text color="textMuted">Aucun exercice</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/exercises/${item.id}`)}
              style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.md,
                padding: t.spacing.lg, marginBottom: t.spacing.md, borderWidth: 1, borderColor: t.colors.border }}
            >
              <Text variant="bodyMedium">{item.name}</Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                {item.primary_muscle?.name ?? '—'} · {LEVEL_LABELS_SHORT[item.level] ?? item.level}
                {item.is_bodyweight ? ' · Poids du corps' : ''}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
