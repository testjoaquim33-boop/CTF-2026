import React, { useState } from 'react';
import { View, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { useExercises } from '../../src/hooks/useExercises';
import { useActiveWorkout } from '../../src/store/activeWorkout';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

export default function NewWorkout() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const [name, setName] = useState(tr('nw.defaultName'));
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const { data } = useExercises({});
  const start = useActiveWorkout((s) => s.start);
  const addExercise = useActiveWorkout((s) => s.addExercise);

  const toggle = (id: string, exName: string) =>
    setPicked((p) => (p.some((x) => x.id === id) ? p.filter((x) => x.id !== id) : [...p, { id, name: exName }]));

  const begin = () => {
    start(name);
    picked.forEach((p) => addExercise(p.id, p.name));
    router.replace('/workout/active');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <Text variant="h1">{tr('nw.title')}</Text>
        <TextInput value={name} onChangeText={setName} placeholder={tr('nw.name')} placeholderTextColor={t.colors.textMuted}
          style={{ backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.md, padding: t.spacing.md }} />
        <Text color="textSecondary" variant="caption">{tr('nw.pick', { n: picked.length })}</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
        renderItem={({ item }) => {
          const on = picked.some((x) => x.id === item.id);
          return (
            <Pressable onPress={() => toggle(item.id, exName(item))}
              style={{ padding: t.spacing.md, marginBottom: t.spacing.sm, borderRadius: t.radius.md,
                backgroundColor: on ? t.colors.primary + '22' : t.colors.bgElevated,
                borderWidth: 1, borderColor: on ? t.colors.primary : t.colors.border }}>
              <Text>{exName(item)}</Text>
            </Pressable>
          );
        }}
      />
      <View style={{ padding: t.spacing.lg }}>
        <Button label={tr('nw.start')} onPress={begin} disabled={picked.length === 0} />
      </View>
    </SafeAreaView>
  );
}
