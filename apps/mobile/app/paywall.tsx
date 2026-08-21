import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/theme/ThemeProvider';
import { Text, Button } from '../src/components';
import { purchasesEnabled } from '../src/services/purchases';
import { track, EVENTS } from '../src/services/analytics';

const BENEFITS = [
  'AI Coach illimité',
  'Programmes personnalisés',
  'Adaptation automatique',
  'Classements complets',
  'Statistiques avancées',
  'Challenges Premium',
];

export default function Paywall() {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { track(EVENTS.paywallViewed); }, []);

  const buy = async () => {
    if (!purchasesEnabled()) {
      Alert.alert('Bientôt disponible',
        "Les abonnements seront activés une fois RevenueCat configuré (voir docs/MONETIZATION.md).");
      return;
    }
    setBusy(true);
    // L'implémentation d'achat (offerings -> purchase) s'active avec les clés RevenueCat.
    const { getOfferingPackages, purchase } = await import('../src/services/purchases');
    try {
      const pkgs = await getOfferingPackages();
      if (pkgs.length === 0) { Alert.alert('Aucune offre disponible'); return; }
      const res = await purchase(pkgs[0]);
      if (res.ok) { Alert.alert('Merci !', 'Ton accès Premium sera actif dans un instant.'); router.back(); }
      else if (res.error !== 'cancelled') Alert.alert('Achat échoué', res.error ?? '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing.xl, gap: t.spacing.md, flexGrow: 1, justifyContent: 'center' }}>
        <Text variant="display" color="primary">Premium</Text>
        <Text variant="h3" color="textSecondary">Débloque tout ton potentiel.</Text>
        <View style={{ gap: t.spacing.sm, marginVertical: t.spacing.lg }}>
          {BENEFITS.map((b) => (
            <Text key={b} variant="bodyMedium">✓ {b}</Text>
          ))}
        </View>
        <Button label={busy ? '…' : "Passer Premium"} onPress={buy} disabled={busy} />
        <Button label="Plus tard" variant="secondary" onPress={() => router.back()} />
        <Text variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: t.spacing.md }}>
          Abonnement mensuel ou annuel. Résiliable à tout moment. Restauration des achats disponible.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
