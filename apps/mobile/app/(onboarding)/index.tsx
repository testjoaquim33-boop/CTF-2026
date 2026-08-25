import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { BRANDING } from '../../src/constants/branding';
import { useT } from '../../src/i18n/useT';

export default function Welcome() {
  const t = useTheme();
  const tr = useT();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.spacing.xl, gap: t.spacing.md }}>
        <Text variant="display">{BRANDING.appName}</Text>
        <Text variant="h3" color="textSecondary">{tr('onb.welcome.tagline')}</Text>
      </View>
      <View style={{ padding: t.spacing.xl }}>
        <Button label={tr('onb.welcome.start')} onPress={() => router.push('/(onboarding)/objective')} />
      </View>
    </SafeAreaView>
  );
}
