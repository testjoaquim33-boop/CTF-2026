import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** Petit graphique à barres (sans dépendance native). values : nombres. */
export function MiniBarChart({ values, height = 120 }: { values: number[]; height?: number }) {
  const t = useTheme();
  if (values.length === 0) return <Text color="textMuted">Pas encore de données</Text>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 4 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{
            height: 8 + ((v - min) / range) * (height - 8),
            backgroundColor: t.colors.primary, borderRadius: t.radius.sm,
          }} />
        </View>
      ))}
    </View>
  );
}
