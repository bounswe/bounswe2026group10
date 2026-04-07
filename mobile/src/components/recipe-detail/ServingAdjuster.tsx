import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface ServingAdjusterProps {
  servings: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ServingAdjuster({
  servings,
  onIncrement,
  onDecrement,
}: ServingAdjusterProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onDecrement}
        style={[styles.button, servings <= 1 && styles.buttonDisabled]}
        disabled={servings <= 1}
        activeOpacity={0.6}
      >
        <Text style={[styles.buttonText, servings <= 1 && styles.buttonTextDisabled]}>
          −
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>
        {servings} {servings === 1 ? t('recipeDetail.servingsLabel') : t('recipeDetail.servingsLabelPlural')}
      </Text>
      <TouchableOpacity onPress={onIncrement} style={styles.button} activeOpacity={0.6}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.outline,
  },
  buttonText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.lg,
    color: colors.white,
    lineHeight: 20,
  },
  buttonTextDisabled: {
    color: colors.onSurfaceVariant,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
    marginHorizontal: spacing.sm,
  },
});
