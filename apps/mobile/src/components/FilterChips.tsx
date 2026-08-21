import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface Props<T extends string> {
  options: { id: T; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: t.spacing.sm, paddingVertical: t.spacing.sm }}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <Pressable key={o.id} onPress={() => onChange(active ? undefined : o.id)}
            style={{
              paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm,
              borderRadius: t.radius.pill,
              backgroundColor: active ? t.colors.primary : t.colors.bgElevated,
              borderWidth: 1, borderColor: active ? t.colors.primary : t.colors.border,
            }}>
            <Text variant="caption" color={active ? 'onPrimary' : 'textSecondary'}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
