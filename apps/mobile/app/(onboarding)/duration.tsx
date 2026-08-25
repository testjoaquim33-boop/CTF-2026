import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { DURATION_OPTIONS } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function DurationStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<number>
      step="duration"
      title={tr('onb.title.duration')}
      choices={DURATION_OPTIONS.map((v) => ({ value: v, title: tr(`onb.dur.${v}`) }))}
      value={draft.durationMinutes}
      onSelect={(durationMinutes) => set({ durationMinutes })}
      onNext={() => router.push('/(onboarding)/location')}
    />
  );
}
