import React, { useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, FilterChips, ExerciseThumb, muscleColor } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { MUSCLE_GROUPS } from '../../src/features/exercises/groups';
import type { Level } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

export default function ExerciseListScreen() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const [group, setGroup] = useState<string | undefined>();
  const [level, setLevel] = useState<Level | undefined>();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useExercises({ muscleGroup: group, level, search });
  const groups = MUSCLE_GROUPS.map((g) => ({ id: g.id, label: tr(`mg.${g.id}`) }));
  const LEVELS = [
    { id: 'beginner' as Level, label: tr('onb.lvl.beginner') },
    { id: 'intermediate' as Level, label: tr('onb.lvl.intermediate') },
    { id: 'advanced' as Level, label: tr('onb.lvl.advanced') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <Text variant="h1">{tr('lib.title')}</Text>
        <TextInput
          placeholder={tr('common.search')}
          placeholderTextColor={t.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text,
            borderRadius: t.radius.md, padding: t.spacing.md, fontSize: 15 }}
        />
        <FilterChips options={groups} value={group} onChange={setGroup} />
        <FilterChips options={LEVELS} value={level} onChange={setLevel} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.xl }} />
      ) : error ? (
        <Text color="danger" style={{ padding: t.spacing.lg }}>{tr('lib.loadError')}</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
          ListEmptyComponent={<Text color="textMuted">{tr('lib.empty')}</Text>}
          renderItem={({ item }) => {
            const mc = muscleColor(t.colors, item.primary_muscle?.group);
            return (
              <Pressable
                onPress={() => router.push(`/exercises/${item.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md,
                  backgroundColor: t.colors.bgCard, borderRadius: t.radius.md,
                  padding: t.spacing.md, marginBottom: t.spacing.md,
                  borderLeftWidth: 4, borderLeftColor: mc,
                  borderWidth: 1, borderColor: t.colors.border }}
              >
                <ExerciseThumb imageUrl={item.image_url} group={item.primary_muscle?.group} name={exName(item)} size={52} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{exName(item)}</Text>
                  <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                    {item.primary_muscle?.name ?? '—'} · {tr(`onb.lvl.${item.level}`)}
                    {item.is_bodyweight ? ` · ${tr('ex.bodyweight')}` : ''}
                  </Text>
                </View>
                <Text style={{ color: mc, fontSize: 20 }}>›</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
