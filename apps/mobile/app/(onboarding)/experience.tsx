import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { EXPERIENCE_BANDS, type ExperienceBand } from '@project_fit/shared';
import { EXPERIENCE_LABELS } from '../../src/features/onboarding/labels';

export default function ExperienceStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<ExperienceBand>
      step="experience"
      title="Ton expérience"
      choices={EXPERIENCE_BANDS.map((v) => ({ value: v, title: EXPERIENCE_LABELS[v].title }))}
      value={draft.experience}
      onSelect={(experience) => set({ experience })}
      onNext={() => router.push('/(onboarding)/sessions')}
    />
  );
}
