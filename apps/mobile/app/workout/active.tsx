import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { useActiveWorkout } from '../../src/store/activeWorkout';
import { useRestTimer } from '../../src/hooks/useRestTimer';
import { finishWorkout } from '../../src/services/workouts';
import { formatDuration } from '@project_fit/shared';

const REST_SECONDS = 120;

export default function ActiveWorkout() {
  const t = useTheme();
  const store = useActiveWorkout();
  const { remaining, running, startRest, stopRest } = useRestTimer();
  const [saving, setSaving] = useState(false);

  if (!store.active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.lg }}>
        <Text>Aucune séance en cours.</Text>
        <Button label="Nouvelle séance" onPress={() => router.replace('/workout/new')} style={{ marginTop: t.spacing.lg }} />
      </SafeAreaView>
    );
  }

  const finish = async () => {
    setSaving(true);
    const res = await finishWorkout({
      name: store.name, startedAt: store.startedAt, clientUuid: store.clientUuid!, exercises: store.exercises,
    });
    setSaving(false);
    if (!res.ok) { Alert.alert('Erreur', res.error ?? 'unknown'); return; }
    const prs = res.newPRs ?? [];
    const badges = res.newBadges ?? [];
    store.reset();
    const lines: string[] = [];
    if (prs.length > 0) {
      lines.push('🔥 Records', ...prs.map((p) => `• ${p.exerciseName}: ${p.value} ${p.unit}`));
    }
    if (badges.length > 0) {
      if (lines.length) lines.push('');
      lines.push('🏅 Badges débloqués', ...badges.map((b) => `• ${b.icon ?? '🏅'} ${b.name}`));
    }
    if (lines.length > 0) {
      const title = badges.length > 0 && prs.length === 0 ? '🏅 Nouveau badge !' : '🔥 Séance terminée !';
      Alert.alert(title, lines.join('\n'), [{ text: 'Génial', onPress: () => router.replace('/(tabs)') }]);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flex: 1 }}>
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}>
            <Text variant="h3" color="textSecondary">‹</Text>
          </Pressable>
          <Text variant="h2">{store.name}</Text>
        </View>
        {running ? (
          <Pressable onPress={stopRest} style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.pill, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm }}>
            <Text color="onPrimary" variant="bodyMedium">Repos {formatDuration(remaining)}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}>
        {store.exercises.map((ex, exIndex) => (
          <View key={exIndex} style={{ marginBottom: t.spacing.xl, backgroundColor: t.colors.bgElevated,
            borderRadius: t.radius.md, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border }}>
            <Text variant="h3" style={{ marginBottom: t.spacing.md }}>{ex.name}</Text>

            {ex.sets.map((s, setIndex) => (
              <View key={setIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm }}>
                <Text color="textMuted" style={{ width: 24 }}>{setIndex + 1}</Text>
                <TextInput
                  defaultValue={s.weightKg ? String(s.weightKg) : ''}
                  onChangeText={(v) => store.updateSet(exIndex, setIndex, { weightKg: parseFloat(v) || 0 })}
                  keyboardType="numeric" placeholder="kg" placeholderTextColor={t.colors.textMuted}
                  style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.sm, padding: t.spacing.sm, textAlign: 'center' }}
                />
                <Text color="textMuted">×</Text>
                <TextInput
                  defaultValue={s.reps ? String(s.reps) : ''}
                  onChangeText={(v) => store.updateSet(exIndex, setIndex, { reps: parseInt(v, 10) || 0 })}
                  keyboardType="numeric" placeholder="reps" placeholderTextColor={t.colors.textMuted}
                  style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: t.radius.sm, padding: t.spacing.sm, textAlign: 'center' }}
                />
                <Pressable
                  onPress={() => { store.updateSet(exIndex, setIndex, { completed: !s.completed }); if (!s.completed) startRest(REST_SECONDS); }}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: s.completed ? t.colors.success : t.colors.bgInput }}>
                  <Text color={s.completed ? 'onPrimary' : 'textMuted'}>✓</Text>
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => store.addSet(exIndex)} style={{ marginTop: t.spacing.sm }}>
              <Text color="primary">+ Ajouter une série</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: t.spacing.lg, gap: t.spacing.sm }}>
        <Button label="+ Ajouter un exercice" variant="secondary" onPress={() => router.push('/workout/add-exercise')} />
        <Button label={saving ? 'Enregistrement…' : 'Terminer la séance'} onPress={finish} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}
