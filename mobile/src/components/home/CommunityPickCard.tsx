import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RecipeListItem } from '../../api/home';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface CommunityPickCardProps {
  recipe: RecipeListItem;
  onPress?: () => void;
}

export function CommunityPickCard({ recipe, onPress }: CommunityPickCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      {recipe.imageUrl ? (
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
        />
      ) : (
        <View style={styles.image} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        {recipe.creatorUsername && (
          <Text style={styles.author} numberOfLines={1}>
            {recipe.creatorUsername}
          </Text>
        )}
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={14} color={colors.starYellow} />
          <Text style={styles.rating}>
            {recipe.averageRating?.toFixed(1) ?? '—'}
          </Text>
          <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
        </View>
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
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  rating: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
    marginLeft: 2,
  },
  ratingCount: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    marginLeft: 2,
  },
});
