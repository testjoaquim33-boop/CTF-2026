import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const RANK_META: Record<string, { label: string; emoji: string; colorKey: keyof import('../theme/colors').RankColors }> = {
  bronze: { label: 'Bronze', emoji: '🥉', colorKey: 'bronze' },
  silver: { label: 'Silver', emoji: '🥈', colorKey: 'silver' },
  gold: { label: 'Gold', emoji: '🥇', colorKey: 'gold' },
  platinum: { label: 'Platinum', emoji: '💎', colorKey: 'platinum' },
  diamond: { label: 'Diamond', emoji: '🔷', colorKey: 'diamond' },
  elite: { label: 'Elite', emoji: '👑', colorKey: 'elite' },
};

export function RankBadge({ slug }: { slug: string | null }) {
  const t = useTheme();
  if (!slug || !RANK_META[slug]) {
    return <Text variant="caption" color="textMuted">Non classé</Text>;
  }
  const meta = RANK_META[slug];
  const color = t.colors.rank[meta.colorKey];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: t.spacing.sm,
      paddingVertical: 2, borderRadius: t.radius.pill, borderWidth: 1, borderColor: color }}>
      <Text variant="caption" style={{ color }}>{meta.emoji} {meta.label}</Text>
    </View>
  );
}
