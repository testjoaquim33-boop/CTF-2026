import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/** Barre de progression 0..1. */
export function ProgressBar({ progress }: { progress: number }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ height: 6, backgroundColor: t.colors.bgInput, borderRadius: t.radius.pill }}>
      <View
        style={{
          height: 6,
          width: `${pct * 100}%`,
          backgroundColor: t.colors.primary,
          borderRadius: t.radius.pill,
        }}
      />
    </View>
  );
}
