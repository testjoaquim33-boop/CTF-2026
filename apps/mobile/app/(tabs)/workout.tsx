import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Text, Button } from '../../src/components';
import { useActiveWorkout } from '../../src/store/activeWorkout';

export default function WorkoutScreen() {
  const t = useTheme();
  const active = useActiveWorkout((s) => s.active);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, padding: t.spacing.xl, gap: t.spacing.md, justifyContent: 'center' }}>
        <Text variant="h1">Séance</Text>
        {active ? (
          <Button label="Reprendre la séance" onPress={() => router.push('/workout/active')} />
        ) : (
          <Button label="Nouvelle séance" onPress={() => router.push('/workout/new')} />
        )}
        <Button label="Parcourir les exercices" variant="secondary" onPress={() => router.push('/exercises')} />
      </View>
    </SafeAreaView>
  );
}
