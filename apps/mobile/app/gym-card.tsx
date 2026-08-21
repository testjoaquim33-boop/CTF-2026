import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text, Button, RankBadge } from '../src/components';
import { fetchHomeStats } from '../src/services/gamification';
import { fetchMyEntries } from '../src/services/ranking';
import { track, EVENTS } from '../src/services/analytics';

export default function GymCard() {
  const t = useTheme();
  const ref = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const home = useQuery({ queryKey: ['home'], queryFn: fetchHomeStats });
  const entries = useQuery({ queryKey: ['myEntries'], queryFn: fetchMyEntries });

  const share = async () => {
    setSharing(true);
    try {
      const { captureRef } = await import('react-native-view-shot');
      const Sharing = await import('expo-sharing');
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        track(EVENTS.shareGymCard);
      } else {
        Alert.alert('Partage indisponible sur cet appareil');
      }
    } catch (e) {
      Alert.alert('Erreur', (e as { message?: string }).message ?? 'Partage impossible');
    } finally {
      setSharing(false);
    }
  };

  if (home.isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg, padding: t.spacing.lg, gap: t.spacing.lg }}>
      <View ref={ref} collapsable={false}
        style={{ backgroundColor: t.colors.bgElevated, borderRadius: t.radius.lg, padding: t.spacing.xl,
          borderWidth: 1, borderColor: t.colors.primary, gap: t.spacing.md }}>
        <Text variant="overline" color="textMuted">MY GYM CARD</Text>
        <Text variant="display" color="primary">Niveau {home.data?.level}</Text>
        <Text color="textSecondary">{home.data?.title} · 🔥 {home.data?.streak ?? 0} j</Text>
        <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.sm }} />
        {(entries.data ?? []).slice(0, 4).map((e) => (
          <View key={e.exercise_id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyMedium">{e.exerciseName}</Text>
            <RankBadge slug={e.rankSlug} />
          </View>
        ))}
        {(entries.data ?? []).length === 0 ? <Text color="textMuted">Publie tes scores pour remplir ta carte</Text> : null}
      </View>

      <Button label={sharing ? '…' : 'Partager'} onPress={share} disabled={sharing} />
      <Button label="Retour" variant="secondary" onPress={() => router.back()} />
    </SafeAreaView>
  );
}
