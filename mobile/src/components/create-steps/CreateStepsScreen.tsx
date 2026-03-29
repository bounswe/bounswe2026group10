import React, { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { IconButton } from '../shared/IconButton';
import { StepHeader } from '../create-basic/StepHeader';
import { StepEditor } from './StepEditor';
import type { StepFormItem, StepFormItemErrors } from './StepEditor';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

let nextId = 1;
function generateId(): string {
  return String(nextId++);
}

function createEmptyStep(): StepFormItem {
  return {
    id: generateId(),
    title: '',
    description: '',
    videoUri: null,
    videoFileName: null,
    isExpanded: true,
  };
}

export function CreateStepsScreen() {
  const navigation = useNavigation();
  const [steps, setSteps] = useState<StepFormItem[]>([createEmptyStep()]);
  const [stepErrors, setStepErrors] = useState<Record<string, StepFormItemErrors>>({});

  const handleUpdateStep = (id: string, updated: StepFormItem) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (stepErrors[id]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAddStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => [...prev, createEmptyStep()]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setStepErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, StepFormItemErrors> = {};

    for (const step of steps) {
      const errs: StepFormItemErrors = {};
      if (!step.description.trim()) {
        errs.description = 'Description is required';
      }
      if (!step.videoUri) {
        errs.video = 'A video is required for each step';
      }
      if (Object.keys(errs).length > 0) {
        newErrors[step.id] = errs;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setSteps((prev) =>
        prev.map((s) => (newErrors[s.id] ? { ...s, isExpanded: true } : s))
      );
      setStepErrors(newErrors);
      return false;
    }

    setStepErrors({});
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      Alert.alert('Next', 'Navigation to Review screen coming soon.');
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your recipe draft has been saved.');
  };

  const handleClose = () => {
    Alert.alert('Discard Recipe?', 'Your changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton name="close" onPress={handleClose} />
        <Text style={styles.logoText}>Roots & Recipes</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader
          currentStep={3}
          totalSteps={4}
          title="Recipe Steps"
          subtitle="Break down the preparation into steps, just as they were taught to you."
        />

        {steps.map((step, index) => (
          <StepEditor
            key={step.id}
            step={step}
            stepNumber={index + 1}
            onUpdate={(updated) => handleUpdateStep(step.id, updated)}
            onDelete={() => handleDeleteStep(step.id)}
            canDelete={steps.length > 1}
            errors={stepErrors[step.id]}
          />
        ))}

        <TouchableOpacity style={styles.addStepButton} onPress={handleAddStep} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addStepText}>Add Step</Text>
        </TouchableOpacity>

        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next: Review</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft} activeOpacity={0.7}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logoText: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  addStepText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  navigationRow: {
    marginTop: spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  saveDraftButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  saveDraftText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.lg,
    color: colors.onSurfaceVariant,
  },
});
