import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Step } from '../../types/step';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StepRowProps {
  step: Step;
}

export function StepRow({ step }: StepRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numberCircle}>
        <Text style={styles.number}>{step.stepNumber}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
        {step.durationMinutes !== undefined && (
          <Text style={styles.duration}>{step.durationMinutes} min</Text>
        )}
        {step.imageUrl && (
          <Image source={{ uri: step.imageUrl }} style={styles.image} resizeMode="cover" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  number: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    lineHeight: 20,
  },
  duration: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceContainer,
  },
});
