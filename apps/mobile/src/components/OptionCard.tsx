import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

/** Carte de sélection (onboarding). Sélection = bordure + fond primaires. */
export function OptionCard({ label, description, selected, onPress }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? t.colors.primary + '22' : t.colors.bgElevated,
        borderColor: selected ? t.colors.primary : t.colors.border,
        borderWidth: selected ? 2 : 1,
        borderRadius: t.radius.md,
        padding: t.spacing.lg,
        marginBottom: t.spacing.md,
      }}
    >
      <Text variant="bodyMedium">{label}</Text>
      {description ? (
        <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}
