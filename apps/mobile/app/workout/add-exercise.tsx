import React, { useState } from 'react';
import { View, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, FilterChips, ExerciseThumb, muscleColor } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { useActiveWorkout } from '../../src/store/activeWorkout';
import { MUSCLE_GROUPS } from '../../src/features/exercises/groups';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

export default function AddExercise() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const [group, setGroup] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useExercises({ muscleGroup: group, search });
  const addExercise = useActiveWorkout((s) => s.addExercise);
  const existing = useActiveWorkout((s) => s.exercises);
  const groups = MUSCLE_GROUPS.map((g) => ({ id: g.id, label: tr(`mg.${g.id}`) }));

  const add = (id: string, name: string) => {
    addExercise(id, name);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text variant="h3" color="textSecondary">{tr('onb.back')}</Text>
          </Pressable>
          <Text variant="h2" style={{ flex: 1 }}>{tr('ax.title')}</Text>
        </View>
        <TextInput placeholder={tr('common.search')} placeholderTextColor={t.colors.textMuted}
          value={search} onChangeText={setSearch}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md }} />
        <FilterChips options={groups} value={group} onChange={setGroup} />
      </View>
      {isLoading ? <ActivityIndicator color={t.colors.primary} /> : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
          renderItem={({ item }) => {
            const mc = muscleColor(t.colors, item.primary_muscle?.group);
            const already = existing.some((e) => e.exerciseId === item.id);
            return (
              <Pressable onPress={() => add(item.id, exName(item))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, backgroundColor: t.colors.bgCard,
                  borderRadius: t.radius.md, padding: t.spacing.md, marginBottom: t.spacing.md,
                  borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: mc }}>
                <ExerciseThumb group={item.primary_muscle?.group} size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{exName(item)}</Text>
                  <Text variant="caption" color="textSecondary">{item.primary_muscle?.name ?? '—'}</Text>
                </View>
                <Text style={{ color: already ? t.colors.success : mc, fontSize: 22 }}>{already ? '✓' : '+'}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
