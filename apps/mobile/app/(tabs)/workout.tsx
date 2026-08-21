import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';

export default function WorkoutScreen() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, padding: t.spacing.xl, gap: t.spacing.md, justifyContent: 'center' }}>
        <Text variant="h1">Séance</Text>
        <Text color="textSecondary">Le moteur de séance arrive à la phase suivante.</Text>
        <Button label="Parcourir les exercices" onPress={() => router.push('/exercises')} style={{ marginTop: t.spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}
