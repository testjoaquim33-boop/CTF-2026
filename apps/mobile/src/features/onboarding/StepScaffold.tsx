import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, ProgressBar } from '../../components';
import { ONBOARDING_STEPS, type OnboardingStep } from '@project_fit/shared';

interface Props {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  canContinue: boolean;
  onNext: () => void;
  nextLabel?: string;
  children: React.ReactNode;
}

export function StepScaffold({ step, title, subtitle, canContinue, onNext, nextLabel = 'Continuer', children }: Props) {
  const t = useTheme();
  const idx = ONBOARDING_STEPS.indexOf(step);
  const progress = (idx + 1) / ONBOARDING_STEPS.length;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <ProgressBar progress={progress} />
        <Text variant="h1">{title}</Text>
        {subtitle ? <Text color="textSecondary">{subtitle}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}>
        {children}
      </ScrollView>
      <View style={{ padding: t.spacing.lg }}>
        <Button label={nextLabel} onPress={onNext} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}
