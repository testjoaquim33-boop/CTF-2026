import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { MuscleColors } from '../theme/colors';
import { Text } from './Text';

const GROUP_EMOJI: Record<string, string> = {
  push: '🔥', pull: '🎯', legs: '🦵', core: '🧱', posterior: '⚡', arms: '💪',
};

export function muscleColor(colors: { muscle: MuscleColors }, group?: string | null): string {
  const key = (group ?? 'push') as keyof MuscleColors;
  return colors.muscle[key] ?? colors.muscle.push;
}

export function ExerciseThumb({
  imageUrl, group, size = 56, radius,
}: { imageUrl?: string | null; group?: string | null; name?: string; size?: number; radius?: number }) {
  const t = useTheme();
  const [error, setError] = useState(false);
  const r = radius ?? t.radius.md;

  if (imageUrl && !error) {
    return (
      <Image
        source={{ uri: imageUrl }}
        onError={() => setError(true)}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: t.colors.bgInput }}
      />
    );
  }
  const color = muscleColor(t.colors, group);
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: color + '26', borderWidth: 1, borderColor: color + '55',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.4 }}>{GROUP_EMOJI[group ?? 'push'] ?? '💪'}</Text>
    </View>
  );
}
