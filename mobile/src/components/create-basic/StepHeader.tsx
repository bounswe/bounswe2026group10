import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
}

export function StepHeader({ currentStep, totalSteps, title, subtitle }: StepHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {t('create.stepBadge', { current: currentStep, total: totalSteps })}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  badge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
