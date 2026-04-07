import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SortOption } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface SortRowProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortRow({ activeSort, onSortChange }: SortRowProps) {
  const { t } = useTranslation('common');
  const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'rating', label: t('search.sortBestRating') },
    { key: 'recent', label: t('search.sortMostRecent') },
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('search.sortLabel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SORT_OPTIONS.map((option) => {
          const isActive = option.key === activeSort;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onSortChange(option.key)}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  scroll: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 50,
    backgroundColor: colors.surfaceContainer,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: colors.white,
  },
});
