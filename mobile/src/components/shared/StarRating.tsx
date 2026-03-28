import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export function StarRating({ rating, count, size = 16 }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <View style={styles.container}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <MaterialCommunityIcons
          key={`full-${i}`}
          name="star"
          size={size}
          color={colors.starYellow}
        />
      ))}
      {hasHalf && (
        <MaterialCommunityIcons
          name="star-half-full"
          size={size}
          color={colors.starYellow}
        />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <MaterialCommunityIcons
          key={`empty-${i}`}
          name="star-outline"
          size={size}
          color={colors.starYellow}
        />
      ))}
      {count !== undefined && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
});
