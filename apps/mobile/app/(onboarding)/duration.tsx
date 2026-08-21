import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { DURATION_OPTIONS } from '@project_fit/shared';
import { DURATION_LABELS } from '../../src/features/onboarding/labels';

export default function DurationStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<number>
      step="duration"
      title="Durée d'une séance"
      choices={DURATION_OPTIONS.map((v) => ({ value: v, title: DURATION_LABELS[v] }))}
      value={draft.durationMinutes}
      onSelect={(durationMinutes) => set({ durationMinutes })}
      onNext={() => router.push('/(onboarding)/location')}
    />
  );
}
