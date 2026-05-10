import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { pickCulturalTagLabel, type CulturalTagItem } from '../../api/cultural-tags';

interface CulturalTagChipsProps {
  tags: CulturalTagItem[];
}

export function CulturalTagChips({ tags }: CulturalTagChipsProps) {
  const { i18n } = useTranslation('common');
  if (tags.length === 0) return null;

  return (
    <View style={styles.row}>
      {tags.map((tag) => (
        <View key={tag.id} style={styles.chip} testID={`cultural-tag-chip-${tag.key}`}>
          <Text style={styles.chipText}>{pickCulturalTagLabel(tag, i18n.language)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
});
