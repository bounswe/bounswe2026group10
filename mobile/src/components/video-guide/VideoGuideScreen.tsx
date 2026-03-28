import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Recipe } from '../../types/recipe';
import { StepProgressBar } from './StepProgressBar';
import { VideoPlayer } from './VideoPlayer';
import { StepNavigation } from './StepNavigation';

interface VideoGuideScreenProps {
  recipe: Recipe;
  onClose: () => void;
}

export function VideoGuideScreen({ recipe, onClose }: VideoGuideScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = recipe.steps;
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const goNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StepProgressBar
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          onClose={onClose}
        />

        <VideoPlayer
          key={currentStep.stepNumber}
          videoUrl={currentStep.videoUrl}
          stepNumber={currentStep.stepNumber}
          stepDescription={currentStep.description}
        />

        <StepNavigation
          onPrevious={goPrevious}
          onNext={goNext}
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStepIndex === totalSteps - 1}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
});
