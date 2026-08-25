import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text, Button } from '../src/components';
import { purchasesEnabled } from '../src/services/purchases';
import { track, EVENTS } from '../src/services/analytics';
import { useT } from '../src/i18n/useT';

export default function Paywall() {
  const t = useTheme();
  const tr = useT();
  const [busy, setBusy] = useState(false);
  const BENEFITS = [tr('pw.b1'), tr('pw.b2'), tr('pw.b3'), tr('pw.b4'), tr('pw.b5'), tr('pw.b6')];
  React.useEffect(() => { track(EVENTS.paywallViewed); }, []);

  const buy = async () => {
    if (!purchasesEnabled()) {
      Alert.alert(tr('pw.soonTitle'), tr('pw.soonMsg'));
      return;
    }
    setBusy(true);
    const { getOfferingPackages, purchase } = await import('../src/services/purchases');
    try {
      const pkgs = await getOfferingPackages();
      if (pkgs.length === 0) { Alert.alert(tr('pw.noOffer')); return; }
      const res = await purchase(pkgs[0]);
      if (res.ok) { Alert.alert(tr('pw.thanksTitle'), tr('pw.thanksMsg')); router.back(); }
      else if (res.error !== 'cancelled') Alert.alert(tr('pw.failed'), res.error ?? '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.xl, gap: t.spacing.md, flexGrow: 1, justifyContent: 'center' }}>
        <Text variant="display" color="primary">{tr('pw.title')}</Text>
        <Text variant="h3" color="textSecondary">{tr('pw.subtitle')}</Text>
        <View style={{ gap: t.spacing.sm, marginVertical: t.spacing.lg }}>
          {BENEFITS.map((b) => (
            <Text key={b} variant="bodyMedium">✓ {b}</Text>
          ))}
        </View>
        <Button label={busy ? '…' : tr('pw.go')} onPress={buy} disabled={busy} />
        <Button label={tr('pw.later')} variant="secondary" onPress={() => router.back()} />
        <Text variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: t.spacing.md }}>
          {tr('pw.legal')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
