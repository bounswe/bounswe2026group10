import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Recipe } from '../../api/search';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const isCultural = recipe.recipeType === 'cultural';
  const imageSource = recipe.imageUrl
    ? { uri: recipe.imageUrl }
    : { uri: `https://picsum.photos/seed/r${recipe.id}/400/240` };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.imageWrapper}>
        <Image
          source={imageSource}
          style={styles.image}
        />
        {/* Recipe type badge — top-right, like the example image */}
        <View style={[styles.badge, isCultural ? styles.badgeCultural : styles.badgeCommunity]}>
          <Text style={styles.badgeText}>
            {isCultural ? 'CULTURAL' : 'COMMUNITY'}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.varietyName} numberOfLines={1}>
          {recipe.varietyName}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color={colors.tertiary} />
            <Text style={styles.ratingText}>
              {recipe.averageRating > 0
                ? recipe.averageRating.toFixed(1)
                : 'No ratings'}
            </Text>
            {recipe.ratingCount > 0 && (
              <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
            )}
          </View>
          <View style={styles.authorRow}>
            <MaterialCommunityIcons name="account-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.authorText} numberOfLines={1}>
              {recipe.creatorUsername}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceContainer,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  badgeCommunity: {
    backgroundColor: '#3d7a3d',
  },
  badgeCultural: {
    backgroundColor: '#b8480a',
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xs,
    color: colors.white,
    letterSpacing: 0.5,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  varietyName: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
    lineHeight: 24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.sm,
    color: colors.onSurface,
  },
  ratingCount: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    justifyContent: 'flex-end',
  },
  authorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    maxWidth: 120,
  },
});
