import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

function hexPoints(size: number): string {
  const r = size / 2;
  const cx = r, cy = r;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

export function HexBadge({ level, size = 76 }: { level: number; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Polygon points={hexPoints(size)} fill={t.colors.bgElevated} stroke={t.colors.primary} strokeWidth={2.5} />
      </Svg>
      <Ionicons name="barbell" size={size * 0.34} color={t.colors.text} />
      <View style={{ position: 'absolute', bottom: size * 0.08, backgroundColor: t.colors.primary,
        borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="onPrimary" style={{ fontWeight: '800' }}>{level}</Text>
      </View>
    </View>
  );
}
