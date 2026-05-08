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
  onRatingChange?: () => void;
}

export function RatingPrompt({ recipeId, creatorUsername, onRatingChange }: RatingPromptProps) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
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
  },
});
