import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DishVarietyResult } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface DishVarietyCardProps {
  variety: DishVarietyResult;
  onPress?: () => void;
}

export function DishVarietyCard({ variety, onPress }: DishVarietyCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.image} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {variety.name}
          </Text>
          <MaterialCommunityIcons name="bookmark-outline" size={20} color={colors.tertiary} />
        </View>
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
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  image: {
    width: 88,
    height: 88,
    backgroundColor: colors.surfaceContainer,
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    marginRight: spacing.sm,
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
