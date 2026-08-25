import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { SESSIONS_OPTIONS } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function SessionsStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<number>
      step="sessions"
      title={tr('onb.title.sessions')}
      choices={SESSIONS_OPTIONS.map((v) => ({ value: v, title: tr(`onb.session.${v}`) }))}
      value={draft.sessionsPerWeek}
      onSelect={(sessionsPerWeek) => set({ sessionsPerWeek })}
      onNext={() => router.push('/(onboarding)/duration')}
    />
  );
}
