import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text, ProgressBar, AmbientOrbs } from '../src/components';
import { usePremium } from '../src/hooks/usePremium';
import { fetchChallenges, joinChallenge, leaveChallenge, type ChallengeView } from '../src/services/challenges';

const METRIC_UNIT: Record<string, string> = {
  workouts: 'séances', working_sets: 'séries', volume_kg: 'kg', prs: 'records',
};
const METRIC_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  workouts: 'barbell', working_sets: 'repeat', volume_kg: 'trending-up', prs: 'trophy',
};

function fmt(n: number): string {
  return n >= 1000 ? Math.round(n).toLocaleString('fr-FR') : String(Math.round(n));
}

export default function ChallengesScreen() {
  const t = useTheme();
  const { isPremium } = usePremium();
  const q = useQuery({ queryKey: ['challenges'], queryFn: fetchChallenges });
  const [busy, setBusy] = useState<string | null>(null);

  const items = q.data ?? [];

  const onJoin = async (c: ChallengeView) => {
    if (c.isPremium && !isPremium) {
      Alert.alert('Défi Premium', 'Ce défi est réservé aux membres Premium.', [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Passer Premium', onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    setBusy(c.id);
    const res = await joinChallenge(c.id);
    setBusy(null);
    if (!res.ok) { Alert.alert('Erreur', res.error ?? 'unknown'); return; }
    q.refetch();
  };

  const onLeave = async (c: ChallengeView) => {
    setBusy(c.id);
    const res = await leaveChallenge(c.id);
    setBusy(null);
    if (!res.ok) { Alert.alert('Erreur', res.error ?? 'unknown'); return; }
    q.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <AmbientOrbs colors={[t.colors.secondary, t.colors.primary, t.colors.info]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.lg, paddingBottom: t.spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.bgCard,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Ionicons name="chevron-back" size={22} color={t.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h1">Défis</Text>
          <Text variant="caption" color="textSecondary">Relève un défi et suis ta progression en temps réel.</Text>
        </View>
      </View>

      {q.isLoading ? (
        <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.xl }} />
      ) : q.isError ? (
        <View style={{ padding: t.spacing.lg }}>
          <Text color="danger">Impossible de charger les défis.</Text>
          <Text color="textMuted" variant="caption">
            Assure-toi d'avoir appliqué la migration 0007 et le seed 0005 sur Supabase.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={{ padding: t.spacing.lg }}>
          <Text color="textSecondary">Aucun défi actif pour le moment. Reviens bientôt !</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.md }}>
          {items.map((c) => (
            <ChallengeCard key={c.id} c={c} busy={busy === c.id} onJoin={() => onJoin(c)} onLeave={() => onLeave(c)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ChallengeCard({ c, busy, onJoin, onLeave }: {
  c: ChallengeView; busy: boolean; onJoin: () => void; onLeave: () => void;
}) {
  const t = useTheme();
  const metric = c.config?.metric ?? 'workouts';
  const unit = METRIC_UNIT[metric] ?? '';
  const accent = c.completed ? t.colors.success : t.colors.primary;

  return (
    <View style={{
      backgroundColor: t.colors.bgCard, borderRadius: t.radius.lg, padding: t.spacing.lg,
      borderWidth: 1, borderColor: c.joined ? accent + '66' : t.colors.border, gap: t.spacing.sm,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <View style={{
          width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: accent + '22', borderWidth: 1, borderColor: accent + '55',
        }}>
          <Ionicons name={METRIC_ICON[metric] ?? 'flame'} size={22} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>{c.name}</Text>
            {c.isPremium ? (
              <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: t.radius.pill, backgroundColor: t.colors.primary + '22' }}>
                <Text variant="overline" color="primary">PREMIUM</Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="textSecondary">
            Objectif : {fmt(c.target)} {unit}
            {c.daysLeft != null ? `  ·  ${c.daysLeft} j restants` : ''}
          </Text>
        </View>
        {c.completed ? <Ionicons name="checkmark-circle" size={26} color={t.colors.success} /> : null}
      </View>

      <View style={{ gap: 4 }}>
        <ProgressBar progress={c.progress} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" color="textMuted">{fmt(c.value)} / {fmt(c.target)} {unit}</Text>
          <Text variant="caption" style={{ color: accent }}>{Math.round(c.progress * 100)}%</Text>
        </View>
      </View>

      {c.completed ? (
        <Text variant="overline" style={{ color: t.colors.success }}>DÉFI RELEVÉ 🎉</Text>
      ) : c.joined ? (
        <Pressable onPress={onLeave} disabled={busy}
          style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: t.spacing.md,
            borderRadius: t.radius.sm, borderWidth: 1, borderColor: t.colors.border }}>
          <Text variant="caption" color="textSecondary">{busy ? '…' : 'Quitter'}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onJoin} disabled={busy}
          style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: t.spacing.lg,
            borderRadius: t.radius.sm, backgroundColor: t.colors.primary }}>
          <Text variant="caption" color="onPrimary">{busy ? '…' : 'Rejoindre le défi'}</Text>
        </Pressable>
      )}
    </View>
  );
}
