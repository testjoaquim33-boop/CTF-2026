import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, ProgressBar } from '../../components';
import { ONBOARDING_STEPS, type OnboardingStep } from '@project_fit/shared';
import { useT } from '../../i18n/useT';

interface Props {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  canContinue: boolean;
  onNext: () => void;
  nextLabel?: string;
  children: React.ReactNode;
}

export function StepScaffold({ step, title, subtitle, canContinue, onNext, nextLabel, children }: Props) {
  const t = useTheme();
  const tr = useT();
  const idx = ONBOARDING_STEPS.indexOf(step);
  const progress = (idx + 1) / ONBOARDING_STEPS.length;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          {router.canGoBack() ? (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text variant="h3" color="textSecondary">{tr('onb.back')}</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <ProgressBar progress={progress} />
          </View>
          <Text variant="caption" color="textMuted">{idx + 1}/{ONBOARDING_STEPS.length}</Text>
        </View>
        <Text variant="h1">{title}</Text>
        {subtitle ? <Text color="textSecondary">{subtitle}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}>
        {children}
      </ScrollView>
      <View style={{ padding: t.spacing.lg }}>
        <Button label={nextLabel ?? tr('common.continue')} onPress={onNext} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}
