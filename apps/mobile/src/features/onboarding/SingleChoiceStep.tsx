import React from 'react';
import { OptionCard } from '../../components';
import { StepScaffold } from './StepScaffold';
import type { OnboardingStep } from '@project_fit/shared';

export interface Choice<T> { value: T; title: string; desc?: string }

interface Props<T> {
  step: OnboardingStep;
  title: string;
  subtitle?: string;
  choices: Choice<T>[];
  value: T | undefined;
  onSelect: (v: T) => void;
  onNext: () => void;
}

export function SingleChoiceStep<T extends string | number>({
  step, title, subtitle, choices, value, onSelect, onNext,
}: Props<T>) {
  return (
    <StepScaffold step={step} title={title} subtitle={subtitle} canContinue={value != null} onNext={onNext}>
      {choices.map((c) => (
        <OptionCard
          key={String(c.value)}
          label={c.title}
          description={c.desc}
          selected={value === c.value}
          onPress={() => onSelect(c.value)}
        />
      ))}
    </StepScaffold>
  );
}
