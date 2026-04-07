import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Step } from '../../types/step';
import { SectionHeader } from '../shared/SectionHeader';
import { StepRow } from './StepRow';

interface StepsSectionProps {
  steps: Step[];
}

export function StepsSection({ steps }: StepsSectionProps) {
  const { t } = useTranslation('common');
  return (
    <SectionHeader title={t('recipeDetail.instructions')}>
      <View>
        {steps.map((step) => (
          <StepRow key={step.stepNumber} step={step} />
        ))}
      </View>
    </SectionHeader>
  );
}
