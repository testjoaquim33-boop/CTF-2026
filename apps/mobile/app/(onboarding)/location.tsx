import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { LOCATIONS, type LocationType } from '@project_fit/shared';
import { LOCATION_LABELS } from '../../src/features/onboarding/labels';

export default function LocationStep() {
  const { draft, set } = useOnboardingStore();
  return (
    <SingleChoiceStep<LocationType>
      step="location"
      title="Où t'entraînes-tu ?"
      choices={LOCATIONS.map((v) => ({ value: v, title: LOCATION_LABELS[v].title }))}
      value={draft.location}
      onSelect={(location) => set({ location })}
      onNext={() => router.push('/(onboarding)/equipment')}
    />
  );
}
