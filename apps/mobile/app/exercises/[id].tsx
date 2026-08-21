import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { useExercise } from '../../src/hooks/useExercises';
import { LEVEL_LABELS_SHORT } from '../../src/features/exercises/groups';

export default function ExerciseDetailScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useExercise(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </SafeAreaView>
    );
  }
  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.lg }}>
        <Text color="danger">Exercice introuvable</Text>
        <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: t.spacing.lg }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <Text variant="h1">{data.name}</Text>
        <Text color="textSecondary">
          {data.primary_muscle?.name ?? '—'} · {LEVEL_LABELS_SHORT[data.level] ?? data.level}
          {data.is_bodyweight ? ' · Poids du corps' : ''}
        </Text>
        {data.description ? <Text style={{ marginTop: t.spacing.sm }}>{data.description}</Text> : null}

        {data.instructions?.length ? (
          <View style={{ marginTop: t.spacing.md }}>
            <Text variant="h3" style={{ marginBottom: t.spacing.sm }}>Instructions</Text>
            {data.instructions.map((ins, i) => (
              <Text key={i} style={{ marginBottom: t.spacing.xs }}>{`${i + 1}. ${ins}`}</Text>
            ))}
          </View>
        ) : null}

        {data.common_mistakes?.length ? (
          <View style={{ marginTop: t.spacing.md }}>
            <Text variant="h3" style={{ marginBottom: t.spacing.sm }}>Erreurs fréquentes</Text>
            {data.common_mistakes.map((m, i) => (
              <Text key={i} color="textSecondary" style={{ marginBottom: t.spacing.xs }}>{`• ${m}`}</Text>
            ))}
          </View>
        ) : null}

        <Button label="🤖 Demander à l'AI Coach" onPress={() => router.push(`/coach/${data.id}`)} style={{ marginTop: t.spacing.xl }} />
        <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: t.spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}
