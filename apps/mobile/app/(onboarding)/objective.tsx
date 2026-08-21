import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { OBJECTIVES, type GoalType } from '@project_fit/shared';
import { OBJECTIVE_LABELS } from '../../src/features/onboarding/labels';

export default function ObjectiveStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<GoalType>
      step="objective"
      title="Ton objectif principal"
      choices={OBJECTIVES.map((v) => ({ value: v, title: OBJECTIVE_LABELS[v].title, desc: OBJECTIVE_LABELS[v].desc }))}
      value={draft.objective}
      onSelect={(objective) => set({ objective })}
      onNext={() => router.push('/(onboarding)/level')}
    />
  );
}
