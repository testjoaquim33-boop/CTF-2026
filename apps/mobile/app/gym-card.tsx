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
import { useT } from '../src/i18n/useT';
import { useLocalized } from '../src/i18n/useLocalized';

export default function GymCard() {
  const t = useTheme();
  const tr = useT();
  const { exName } = useLocalized();
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
        Alert.alert(tr('gc.shareUnavailable'));
      }
    } catch (e) {
      Alert.alert(tr('common.error'), (e as { message?: string }).message ?? tr('gc.shareError'));
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
        <Text variant="display" color="primary">{tr('gc.level', { level: home.data?.level ?? 1 })}</Text>
        <Text color="textSecondary">{home.data?.title} · {tr('gc.streak', { n: home.data?.streak ?? 0 })}</Text>
        <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.sm }} />
        {(entries.data ?? []).slice(0, 4).map((e) => (
          <View key={e.exercise_id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyMedium">{exName(e)}</Text>
            <RankBadge slug={e.rankSlug} />
          </View>
        ))}
        {(entries.data ?? []).length === 0 ? <Text color="textMuted">{tr('gc.empty')}</Text> : null}
      </View>

      <Button label={sharing ? '…' : tr('gc.share')} onPress={share} disabled={sharing} />
      <Button label={tr('common.back')} variant="secondary" onPress={() => router.back()} />
    </SafeAreaView>
  );
}
