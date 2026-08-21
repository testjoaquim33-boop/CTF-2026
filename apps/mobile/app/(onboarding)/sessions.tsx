import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { SESSIONS_OPTIONS } from '@project_fit/shared';
import { SESSION_LABELS } from '../../src/features/onboarding/labels';

export default function SessionsStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<number>
      step="sessions"
      title="Séances par semaine"
      choices={SESSIONS_OPTIONS.map((v) => ({ value: v, title: SESSION_LABELS[v] }))}
      value={draft.sessionsPerWeek}
      onSelect={(sessionsPerWeek) => set({ sessionsPerWeek })}
      onNext={() => router.push('/(onboarding)/duration')}
    />
  );
}
