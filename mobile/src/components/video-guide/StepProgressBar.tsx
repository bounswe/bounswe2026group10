import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  onClose,
}: StepProgressBarProps) {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.6}>
        <MaterialCommunityIcons name="close" size={24} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.counter}>
        {currentStep}/{totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  barContainer: {
    flex: 1,
  },
  barBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  counter: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});
