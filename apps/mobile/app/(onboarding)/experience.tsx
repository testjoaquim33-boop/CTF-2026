import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { EXPERIENCE_BANDS, type ExperienceBand } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function ExperienceStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<ExperienceBand>
      step="experience"
      title={tr('onb.title.experience')}
      choices={EXPERIENCE_BANDS.map((v) => ({ value: v, title: tr(`onb.exp.${v}`) }))}
      value={draft.experience}
      onSelect={(experience) => set({ experience })}
      onNext={() => router.push('/(onboarding)/sessions')}
    />
  );
}
