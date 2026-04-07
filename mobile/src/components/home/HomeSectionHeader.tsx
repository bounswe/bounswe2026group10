import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface HomeSectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function HomeSectionHeader({ title, onSeeAll }: HomeSectionHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
  },
  seeAll: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.tertiary,
  },
});
