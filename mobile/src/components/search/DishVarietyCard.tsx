import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DishVarietyResult } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface DishVarietyCardProps {
  variety: DishVarietyResult;
  onPress?: () => void;
}

export function DishVarietyCard({ variety, onPress }: DishVarietyCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {variety.name}
        </Text>
        {variety.description && (
          <Text style={styles.description} numberOfLines={2}>
            {variety.description}
          </Text>
        )}
        {variety.genreName && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{variety.genreName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  tagText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
  },
});
