import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { LEVELS, type Level } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function LevelStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<Level>
      step="level"
      title={tr('onb.title.level')}
      choices={LEVELS.map((v) => ({ value: v, title: tr(`onb.lvl.${v}`) }))}
      value={draft.level}
      onSelect={(level) => set({ level })}
      onNext={() => router.push('/(onboarding)/experience')}
    />
  );
}
