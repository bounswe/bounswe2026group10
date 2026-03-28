import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { User } from '../../types/user';
import type { AllergenTag, DietaryTag, RecipeType } from '../../types/common';
import { StarRating } from '../shared/StarRating';
import { Badge } from '../shared/Badge';
import { IconButton } from '../shared/IconButton';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface RecipeHeaderProps {
  title: string;
  author: User;
  rating: number;
  ratingCount: number;
  type: RecipeType;
  region: string;
  tags: DietaryTag[];
  allergens: AllergenTag[];
  onAuthorPress?: () => void;
}

const dietaryTagColors: Record<DietaryTag, string> = {
  VEGAN: '#386a20',
  VEGETARIAN: '#386a20',
  HALAL: '#586330',
  KOSHER: '#586330',
  GLUTEN_FREE: '#874500',
  HEARTY: '#86452a',
};

const allergenTagColor = '#ba1a1a';

function formatTagLabel(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecipeHeader({
  title,
  author,
  rating,
  ratingCount,
  type,
  region,
  tags,
  allergens,
  onAuthorPress,
}: RecipeHeaderProps) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaRow}>
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.6}>
          <Text style={styles.author}>
            by {author.firstName} {author.lastName}
          </Text>
        </TouchableOpacity>
        <StarRating rating={rating} count={ratingCount} size={14} />
      </View>

      <View style={styles.badgeRow}>
        <Badge
          label={type}
          backgroundColor={type === 'CULTURAL' ? colors.secondary : colors.tertiary}
        />
        <Badge
          label={region}
          backgroundColor={colors.surfaceContainer}
          textColor={colors.onSurface}
        />
      </View>

      {(tags.length > 0 || allergens.length > 0) && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <Badge
              key={tag}
              label={formatTagLabel(tag)}
              backgroundColor={dietaryTagColors[tag]}
            />
          ))}
          {allergens.map((allergen) => (
            <Badge
              key={allergen}
              label={formatTagLabel(allergen)}
              backgroundColor={allergenTagColor}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <IconButton
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          color={bookmarked ? colors.primary : colors.onSurface}
          onPress={() => setBookmarked((prev) => !prev)}
        />
        <IconButton
          name="share-variant-outline"
          onPress={() => Alert.alert('Share', 'Sharing coming soon')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  author: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
