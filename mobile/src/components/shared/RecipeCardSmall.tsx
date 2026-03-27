import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RecipeCard } from '../../types/recipe';
import { StarRating } from './StarRating';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface RecipeCardSmallProps {
  card: RecipeCard;
  onPress?: () => void;
}

export function RecipeCardSmall({ card, onPress }: RecipeCardSmallProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <Image source={{ uri: card.thumbnailUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={styles.author}>
          {card.author.firstName} {card.author.lastName}
        </Text>
        <StarRating rating={card.rating} count={card.ratingCount} size={12} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceContainer,
  },
  info: {
    padding: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
  },
  author: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
