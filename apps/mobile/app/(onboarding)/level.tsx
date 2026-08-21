import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { LEVELS, type Level } from '@project_fit/shared';
import { LEVEL_LABELS } from '../../src/features/onboarding/labels';

export default function LevelStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<Level>
      step="level"
      title="Ton niveau"
      choices={LEVELS.map((v) => ({ value: v, title: LEVEL_LABELS[v].title }))}
      value={draft.level}
      onSelect={(level) => set({ level })}
      onNext={() => router.push('/(onboarding)/experience')}
    />
  );
}
