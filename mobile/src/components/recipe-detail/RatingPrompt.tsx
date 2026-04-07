import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { getUserRating, rateRecipe, deleteUserRating } from '../../api/recipes';
import { useAuth } from '../../context/AuthContext';

interface RatingPromptProps {
  recipeId: string;
  creatorUsername?: string;
  onNavigateToComments?: () => void;
  onRatingChange?: () => void;
}

export function RatingPrompt({ recipeId, creatorUsername, onNavigateToComments, onRatingChange }: RatingPromptProps) {
  const { t } = useTranslation('common');
  const { authState } = useAuth();
  const isAuthenticated = authState.status === 'authenticated';
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserRating(recipeId)
      .then((rating) => {
        if (rating) setSelectedRating(rating.score);
      })
      .catch(() => {});
  }, [recipeId, isAuthenticated]);

  const handleStarPress = async (score: number) => {
    if (!isAuthenticated) {
      Alert.alert(t('common.signInRequired'), t('recipeDetail.ratingLoginPrompt'));
      return;
    }
    if (isAuthenticated && authState.user.username === creatorUsername) {
      Alert.alert(t('recipeDetail.ratingHeading'), t('recipeDetail.ratingOwnRecipe'));
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (score === selectedRating) {
        await deleteUserRating(recipeId);
        setSelectedRating(0);
      } else {
        await rateRecipe(recipeId, score);
        setSelectedRating(score);
      }
      onRatingChange?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit rating';
      Alert.alert(t('recipeDetail.ratingHeading'), message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewComments =
    onNavigateToComments ?? (() => Alert.alert(t('recipeDetail.viewAllComments'), t('common.comingSoon')));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('recipeDetail.yourRating')}</Text>

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={star <= selectedRating ? 'star' : 'star-outline'}
              size={32}
              color={colors.starYellow}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleViewComments}>
        <Text style={styles.viewAll}>{t('recipeDetail.viewAllComments')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert(t('recipeDetail.addThoughts'), t('common.comingSoon'))}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>{t('recipeDetail.addThoughts')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  viewAll: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginBottom: spacing.lg,
  },
  addButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: 12,
  },
  addButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
});
