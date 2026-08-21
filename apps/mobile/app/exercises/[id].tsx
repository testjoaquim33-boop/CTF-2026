import React from 'react';
import { View, ScrollView, ActivityIndicator, Image, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button, muscleColor } from '../../src/components';
import { useExercise } from '../../src/hooks/useExercises';
import { LEVEL_LABELS_SHORT } from '../../src/features/exercises/groups';

const GROUP_EMOJI: Record<string, string> = {
  push: '🔥', pull: '🎯', legs: '🦵', core: '🧱', posterior: '⚡', arms: '💪',
};

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

  const mc = muscleColor(t.colors, data.primary_muscle?.group);
  const group = data.primary_muscle?.group ?? 'push';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: t.spacing.xxl }}>
        {/* HERO : image si dispo (fallback emoji si absente/erreur) */}
        <Hero imageUrl={data.image_url} color={mc} emoji={GROUP_EMOJI[group] ?? '💪'} />

        <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
          <Text variant="h1">{data.name}</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
            <Chip color={mc} label={data.primary_muscle?.name ?? '—'} />
            <Chip color={t.colors.info} label={LEVEL_LABELS_SHORT[data.level] ?? data.level} />
            {data.is_bodyweight ? <Chip color={t.colors.success} label="Poids du corps" /> : null}
          </View>

          {data.video_url ? (
            <Button label="▶  Voir la démonstration" onPress={() => Linking.openURL(data.video_url!)} />
          ) : null}

          {data.description ? <Text style={{ marginTop: t.spacing.xs }}>{data.description}</Text> : null}

          {data.instructions?.length ? (
            <Section title="Instructions" color={mc}>
              {data.instructions.map((ins, i) => (
                <Text key={i} style={{ marginBottom: t.spacing.xs }}>{`${i + 1}. ${ins}`}</Text>
              ))}
            </Section>
          ) : null}

          {data.common_mistakes?.length ? (
            <Section title="Erreurs fréquentes" color={t.colors.warning}>
              {data.common_mistakes.map((m, i) => (
                <Text key={i} color="textSecondary" style={{ marginBottom: t.spacing.xs }}>{`• ${m}`}</Text>
              ))}
            </Section>
          ) : null}

          <Button label="🤖  Demander à l'AI Coach" onPress={() => router.push(`/coach/${data.id}`)} style={{ marginTop: t.spacing.lg }} />
          <Button label="Retour" variant="secondary" onPress={() => router.back()} style={{ marginTop: t.spacing.sm }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Hero({ imageUrl, color, emoji }: { imageUrl: string | null; color: string; emoji: string }) {
  const [error, setError] = React.useState(false);
  return (
    <View style={{ height: 220, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center',
      borderBottomWidth: 2, borderBottomColor: color + '55' }}>
      {imageUrl && !error ? (
        <Image source={{ uri: imageUrl }} onError={() => setError(true)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: 84 }}>{emoji}</Text>
      )}
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
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: t.spacing.md, backgroundColor: t.colors.bgCard, borderRadius: t.radius.md,
      padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border, borderLeftWidth: 4, borderLeftColor: color }}>
      <Text variant="h3" style={{ marginBottom: t.spacing.sm }}>{title}</Text>
      {children}
    </View>
  );
}
