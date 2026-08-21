import React from 'react';
import { Pressable, ActivityIndicator, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const t = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: isPrimary ? t.colors.primary : t.colors.bgElevated,
          borderRadius: t.radius.md,
          paddingVertical: t.spacing.lg,
          paddingHorizontal: t.spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: t.colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? t.colors.onPrimary : t.colors.text} />
      ) : (
        <Text variant="bodyMedium" color={isPrimary ? 'onPrimary' : 'text'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
