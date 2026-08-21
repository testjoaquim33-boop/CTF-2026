import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { typography } from '../theme/tokens';

type Variant = keyof typeof typography;
interface Props extends RNTextProps {
  variant?: Variant;
  color?: 'text' | 'textSecondary' | 'textMuted' | 'primary' | 'onPrimary';
}

export function Text({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const t = useTheme();
  return <RNText style={[t.typography[variant], { color: t.colors[color] }, style]} {...rest} />;
}
