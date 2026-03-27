import React from 'react';
import { View } from 'react-native';
import type { Step } from '../../types/step';
import { SectionHeader } from '../shared/SectionHeader';
import { StepRow } from './StepRow';

interface StepsSectionProps {
  steps: Step[];
}

export function StepsSection({ steps }: StepsSectionProps) {
  return (
    <SectionHeader title="Instructions">
      <View>
        {steps.map((step) => (
          <StepRow key={step.stepNumber} step={step} />
        ))}
      </View>
    </SectionHeader>
  );
}
