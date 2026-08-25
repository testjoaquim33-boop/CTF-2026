import React, { useState } from 'react';
import { View, ScrollView, ImageBackground, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { WORKOUT_CATEGORIES, categoryImageUrl, type WorkoutCategory } from '../../src/features/workout/categories';
import { pickCategoryExercises } from '../../src/services/workoutTemplates';
import { useActiveWorkout } from '../../src/store/activeWorkout';
import { useT } from '../../src/i18n/useT';
import { useLocalized } from '../../src/i18n/useLocalized';

export default function WorkoutScreen() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
  const active = useActiveWorkout((s) => s.active);
  const start = useActiveWorkout((s) => s.start);
  const addExercise = useActiveWorkout((s) => s.addExercise);
  const [loading, setLoading] = useState<string | null>(null);

  const startCategory = async (cat: WorkoutCategory) => {
    setLoading(cat.slug);
    const picks = await pickCategoryExercises(cat);
    setLoading(null);
    start(tr(`wk.cat.${cat.slug}`));
    picks.forEach((p) => addExercise(p.id, exName(p)));
    router.push('/workout/active');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.xxl }}>
        <Text variant="h1">{tr('wk.title')}</Text>
        <Text color="textSecondary">{tr('wk.subtitle')}</Text>

        {active ? (
          <Pressable onPress={() => router.push('/workout/active')}
            style={{ backgroundColor: t.colors.success + '22', borderColor: t.colors.success, borderWidth: 1,
              borderRadius: t.radius.md, padding: t.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <Ionicons name="play-circle" size={28} color={t.colors.success} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>{tr('wk.resume')}</Text>
            <Ionicons name="chevron-forward" size={20} color={t.colors.success} />
          </Pressable>
        ) : null}

        {WORKOUT_CATEGORIES.map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} title={tr(`wk.cat.${cat.slug}`)} exercisesLabel={tr('wk.exercises', { n: cat.exerciseCount })} loading={loading === cat.slug} onPress={() => startCategory(cat)} />
        ))}

        <Button label={tr('wk.free')} variant="secondary" onPress={() => router.push('/workout/new')} style={{ marginTop: t.spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryCard({ cat, title, exercisesLabel, loading, onPress }: { cat: WorkoutCategory; title: string; exercisesLabel: string; loading: boolean; onPress: () => void }) {
  const t = useTheme();
  const [imgError, setImgError] = React.useState(false);

  // Contenu commun (titre traduit + infos) affiché en surimpression.
  const overlay = (
    <>
      {/* Dégradé sombre gauche->droite : recouvre tout texte incrusté dans l'image
          et garantit que le titre affiché suit la langue de l'app. */}
      <LinearGradient
        colors={['#000000F2', '#000000B0', '#00000030']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ padding: t.spacing.lg, flex: 1, justifyContent: 'center' }}>
        <Text variant="h1" color="onPrimary" numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.lg, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={16} color="#FFFFFFDD" />
            <Text variant="caption" style={{ color: '#FFFFFFDD' }}>{cat.minutes} min</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="barbell-outline" size={16} color="#FFFFFFDD" />
            <Text variant="caption" style={{ color: '#FFFFFFDD' }}>{exercisesLabel}</Text>
          </View>
        </View>
      </View>
      {loading ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </>
  );

  return (
    <Pressable onPress={onPress} disabled={loading}
      style={{ borderRadius: t.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border }}>
      {!imgError ? (
        <ImageBackground
          source={{ uri: categoryImageUrl(cat.slug) }}
          onError={() => setImgError(true)}
          style={{ width: '100%', aspectRatio: 1.82 }}
        >
          {overlay}
        </ImageBackground>
      ) : (
        <View style={{ width: '100%', aspectRatio: 1.82, backgroundColor: cat.color + '33' }}>
          <LinearGradient colors={[cat.color + 'E6', cat.color + '55', '#00000000']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject} />
          <Ionicons name="fitness" size={120} color="#FFFFFF14" style={{ position: 'absolute', right: -6, top: 4 }} />
          {overlay}
        </View>
      )}
    </Pressable>
  );
}
