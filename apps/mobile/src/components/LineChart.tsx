import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export function LineChart({ values, width = 300, height = 70, color }: {
  values: number[]; width?: number; height?: number; color?: string;
}) {
  const t = useTheme();
  const c = color ?? t.colors.secondary;
  if (values.length < 2) {
    return <Text variant="caption" color="textMuted">Ajoute des pesées pour voir ta courbe</Text>;
  }
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pad = 6;
  const step = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c} stopOpacity="0.35" />
          <Stop offset="1" stopColor={c} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Polygon points={area} fill="url(#grad)" />
      <Polyline points={line} fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={c} />
    </Svg>
  );
}
