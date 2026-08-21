import React from 'react';
import { router } from 'expo-router';
import { OptionCard } from '../../src/components';
import { StepScaffold } from '../../src/features/onboarding/StepScaffold';
import { useOnboardingStore } from '../../src/store/onboarding';
import { EQUIPMENT_OPTIONS, type EquipmentId } from '@project_fit/shared';
import { EQUIPMENT_LABELS } from '../../src/features/onboarding/labels';

export default function EquipmentStep() {
  const { draft, set } = useOnboardingStore();
  const selected = draft.equipment ?? [];

  const toggle = (id: EquipmentId) => {
    const next = selected.includes(id)
      ? selected.filter((e) => e !== id)
      : [...selected, id];
    set({ equipment: next });
  };

  return (
    <StepScaffold
      step="equipment"
      title="Ton matériel"
      subtitle="Sélectionne tout ce dont tu disposes"
      canContinue={selected.length > 0}
      onNext={() => router.push('/(onboarding)/body')}
    >
      {EQUIPMENT_OPTIONS.map((id) => (
        <OptionCard
          key={id}
          label={EQUIPMENT_LABELS[id].title}
          selected={selected.includes(id)}
          onPress={() => toggle(id)}
        />
      ))}
    </StepScaffold>
  );
}
