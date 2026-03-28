import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StoryCardProps {
  story: string;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.primary} />
        <Text style={styles.headerText}>The Legend of the Dish</Text>
      </View>
      <Text style={styles.story}>{story}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.primary,
  },
  story: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.md,
    color: colors.onSurface,
    lineHeight: 22,
  },
});
