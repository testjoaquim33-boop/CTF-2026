import React from 'react';
import { router } from 'expo-router';
import { SingleChoiceStep } from '../../src/features/onboarding/SingleChoiceStep';
import { useOnboardingStore } from '../../src/store/onboarding';
import { LOCATIONS, type LocationType } from '@project_fit/shared';
import { useT } from '../../src/i18n/useT';

export default function LocationStep() {
  const { draft, set } = useOnboardingStore();
  const tr = useT();
  return (
    <SingleChoiceStep<LocationType>
      step="location"
      title={tr('onb.title.location')}
      choices={LOCATIONS.map((v) => ({ value: v, title: tr(`onb.loc.${v}`) }))}
      value={draft.location}
      onSelect={(location) => set({ location })}
      onNext={() => router.push('/(onboarding)/equipment')}
    />
  );
}
