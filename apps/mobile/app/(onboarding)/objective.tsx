import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { OBJECTIVES, type GoalType } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function ObjectiveStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<GoalType>
      step="objective"
      title={tr('onb.title.objective')}
      choices={OBJECTIVES.map((v) => ({
        value: v,
        title: tr(`onb.obj.${v}`),
        desc: v === 'recomp' ? tr('onb.obj.recomp.desc') : undefined,
      }))}
      value={draft.objective}
      onSelect={(objective) => set({ objective })}
      onNext={() => router.push('/(onboarding)/level')}
    />
  );
}
