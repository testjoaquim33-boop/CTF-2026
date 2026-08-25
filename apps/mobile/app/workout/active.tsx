import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { useActiveWorkout } from '../../src/store/activeWorkout';
import { useExercise } from '../../src/hooks/useExercises';
import { useRestTimer } from '../../src/hooks/useRestTimer';
import { finishWorkout } from '../../src/services/workouts';
import { formatDuration } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

const REST_SECONDS = 120;

export default function ActiveWorkout() {
  const t = useTheme();
  const tr = useT();
  const store = useActiveWorkout();
  const { remaining, running, startRest, stopRest } = useRestTimer();
  const [saving, setSaving] = useState(false);

  if (!store.active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.lg }}>
        <Text>{tr('act.noActive')}</Text>
        <Button label={tr('nw.title')} onPress={() => router.replace('/workout/new')} style={{ marginTop: t.spacing.lg }} />
      </SafeAreaView>
    );
  }

  const finish = async () => {
    setSaving(true);
    const res = await finishWorkout({
      name: store.name, startedAt: store.startedAt, clientUuid: store.clientUuid!, exercises: store.exercises,
    });
    setSaving(false);
    if (!res.ok) { Alert.alert(tr('common.error'), res.error ?? 'unknown'); return; }
    const prs = res.newPRs ?? [];
    const badges = res.newBadges ?? [];
    store.reset();
    const lines: string[] = [];
    if (prs.length > 0) {
      lines.push(tr('act.records'), ...prs.map((p) => `• ${p.exerciseName}: ${p.value} ${p.unit}`));
    }
    if (badges.length > 0) {
      if (lines.length) lines.push('');
      lines.push(tr('act.badges'), ...badges.map((b) => `• ${b.icon ?? '🏅'} ${b.name}`));
    }
    if (lines.length > 0) {
      const title = badges.length > 0 && prs.length === 0 ? tr('act.newBadgeTitle') : tr('act.doneTitle');
      Alert.alert(title, lines.join('\n'), [{ text: tr('act.great'), onPress: () => router.replace('/(tabs)') }]);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: t.colors.text, letterSpacing: -0.4 }} numberOfLines={1}>{store.name}</Text>
        {running ? (
          <Pressable onPress={stopRest} style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: t.colors.primary + '22', borderWidth: 1, borderColor: t.colors.primary + '66',
            borderRadius: 999, paddingHorizontal: 14, height: 40 }}>
            <Ionicons name="timer-outline" size={16} color={t.colors.primary} />
            <Text style={{ fontWeight: '900', color: t.colors.primary, fontVariant: ['tabular-nums'] }}>{formatDuration(remaining)}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {store.exercises.map((ex, exIndex) => (
          <View key={exIndex} style={{ marginBottom: 16, backgroundColor: t.colors.bgCard,
            borderRadius: 22, padding: 16, borderWidth: 1, borderColor: t.colors.border }}>
            <ExerciseHeader exerciseId={ex.exerciseId} name={ex.name} />

            {/* en-têtes de colonnes */}
            {ex.sets.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, paddingHorizontal: 2 }}>
                <Text style={{ width: 30, fontSize: 10, fontWeight: '800', color: t.colors.textMuted, letterSpacing: 0.5, textAlign: 'center' }}>N°</Text>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: t.colors.textMuted, letterSpacing: 0.5 }}>KG</Text>
                <View style={{ width: 16 }} />
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: t.colors.textMuted, letterSpacing: 0.5 }}>REPS</Text>
                <View style={{ width: 40 }} />
              </View>
            ) : null}

            {ex.sets.map((s, setIndex) => (
              <View key={setIndex} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: s.completed ? t.colors.lime + '22' : t.colors.bgInput }}>
                  <Text style={{ fontWeight: '900', fontSize: 13, color: s.completed ? t.colors.lime : t.colors.textSecondary }}>{setIndex + 1}</Text>
                </View>
                <TextInput
                  defaultValue={s.weightKg ? String(s.weightKg) : ''}
                  onChangeText={(v) => store.updateSet(exIndex, setIndex, { weightKg: parseFloat(v) || 0 })}
                  keyboardType="numeric" placeholder="—" placeholderTextColor={t.colors.textMuted}
                  style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: 12,
                    paddingVertical: 11, textAlign: 'center', fontWeight: '800', fontSize: 16 }}
                />
                <Text style={{ color: t.colors.textMuted, width: 16, textAlign: 'center', fontWeight: '800' }}>×</Text>
                <TextInput
                  defaultValue={s.reps ? String(s.reps) : ''}
                  onChangeText={(v) => store.updateSet(exIndex, setIndex, { reps: parseInt(v, 10) || 0 })}
                  keyboardType="numeric" placeholder="—" placeholderTextColor={t.colors.textMuted}
                  style={{ flex: 1, backgroundColor: t.colors.bgInput, color: t.colors.text, borderRadius: 12,
                    paddingVertical: 11, textAlign: 'center', fontWeight: '800', fontSize: 16 }}
                />
                <Pressable
                  onPress={() => { store.updateSet(exIndex, setIndex, { completed: !s.completed }); if (!s.completed) startRest(REST_SECONDS); }}
                  style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: s.completed ? t.colors.lime : t.colors.bgInput,
                    shadowColor: t.colors.lime, shadowOpacity: s.completed ? 0.5 : 0, shadowRadius: 8, elevation: s.completed ? 3 : 0 }}>
                  <Ionicons name="checkmark" size={20} color={s.completed ? '#0B0B0B' : t.colors.textMuted} />
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => store.addSet(exIndex)}
              style={{ marginTop: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: t.colors.border, alignItems: 'center' }}>
              <Text style={{ color: t.colors.primary, fontWeight: '800', fontSize: 13 }}>{tr('act.addSet')}</Text>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={() => router.push('/workout/add-exercise')}
          style={{ paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
            borderColor: t.colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="add" size={18} color={t.colors.textSecondary} />
          <Text style={{ color: t.colors.textSecondary, fontWeight: '800' }}>{tr('act.addExercise')}</Text>
        </Pressable>
      </ScrollView>

      {/* Barre de fin */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: t.colors.border, backgroundColor: t.colors.bg }}>
        <Pressable onPress={finish} disabled={saving} style={{ borderRadius: 16, overflow: 'hidden', opacity: saving ? 0.7 : 1 }}>
          <LinearGradient colors={[t.colors.primary, t.colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{saving ? tr('act.saving') : tr('act.finish')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** En-tête de carte d'exercice : vignette du mouvement (tappable -> fiche animée) + nom.
 *  Le nom est re-localisé en direct (via la fiche) pour suivre la langue courante,
 *  même si l'exercice a été ajouté dans une autre langue. */
function ExerciseHeader({ exerciseId, name }: { exerciseId: string; name: string }) {
  const t = useTheme();
  const { exName } = useLocalized();
  const { data } = useExercise(exerciseId);
  const [err, setErr] = useState(false);
  const img = data?.image_url ?? null;
  const label = data ? exName(data) : name;
  return (
    <Pressable onPress={() => router.push(`/exercises/${exerciseId}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 50, height: 50, borderRadius: 14, overflow: 'hidden',
        backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        {img && !err ? (
          <Image source={{ uri: img }} onError={() => setErr(true)} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
        ) : (
          <Ionicons name="barbell" size={24} color={t.colors.textMuted} />
        )}
      </View>
      <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: t.colors.text }} numberOfLines={2}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={t.colors.textMuted} />
    </Pressable>
  );
}
