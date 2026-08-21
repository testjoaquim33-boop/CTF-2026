import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text } from '../../src/components';

export default function ProfileScreen() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.spacing.xl }}>
        <Text variant="h2">Profil</Text>
        <Text color="textSecondary" style={{ marginTop: t.spacing.sm }}>À venir (phase suivante)</Text>
      </View>
    </SafeAreaView>
  );
}
