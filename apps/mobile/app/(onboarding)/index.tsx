import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { BRANDING } from '../../src/constants/branding';

export default function Welcome() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.spacing.xl, gap: t.spacing.md }}>
        <Text variant="display">{BRANDING.appName}</Text>
        <Text variant="h3" color="textSecondary">
          Ton coach fitness intelligent. Programmes personnalisés, suivi, records et classements.
        </Text>
      </View>
      <View style={{ padding: t.spacing.xl }}>
        <Button label="Commencer" onPress={() => router.push('/(onboarding)/objective')} />
      </View>
    </SafeAreaView>
  );
}
