import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Orbes de couleur floutés en fond (profondeur premium). Purement décoratif. */
export function AmbientOrbs({ colors }: { colors: string[] }) {
  const orbs = [
    { size: 320, top: -120, left: -80, c: colors[0] },
    { size: 300, top: 220, right: -120, c: colors[1] },
    { size: 260, top: 560, left: -100, c: colors[2] ?? colors[0] },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {orbs.map((o, i) => (
        <View key={i} style={{
          position: 'absolute', top: o.top, left: (o as any).left, right: (o as any).right,
          width: o.size, height: o.size, borderRadius: o.size / 2, overflow: 'hidden', opacity: 0.5,
        }}>
          <LinearGradient colors={[o.c + '66', o.c + '00']} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.9, y: 1 }}
            style={{ flex: 1 }} />
        </View>
      ))}
    </View>
  );
}
