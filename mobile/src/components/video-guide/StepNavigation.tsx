import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StepNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function StepNavigation({
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
}: StepNavigationProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrevious}
        style={[styles.prevButton, isFirstStep && styles.buttonDisabled]}
        disabled={isFirstStep}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={18}
          color={isFirstStep ? '#666' : colors.white}
        />
        <Text style={[styles.prevText, isFirstStep && styles.textDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        style={styles.nextButton}
        activeOpacity={0.7}
      >
        <Text style={styles.nextText}>{isLastStep ? 'Finish' : 'Next'}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  prevText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  textDisabled: {
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.xs,
  },
  nextText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});
