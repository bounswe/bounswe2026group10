import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { getUserRating, rateRecipe } from '../../api/recipes';
import { useAuth } from '../../context/AuthContext';

interface RatingPromptProps {
  recipeId: string;
  onViewComments?: () => void;
}

export function RatingPrompt({ recipeId, onViewComments }: RatingPromptProps) {
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
      Alert.alert('Sign in required', 'Please log in to rate this recipe.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await rateRecipe(recipeId, score);
      setSelectedRating(score);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit rating';
      Alert.alert('Rating', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewComments =
    onViewComments ?? (() => Alert.alert('Comments', 'Coming soon'));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How did it turn out?</Text>

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
        <Text style={styles.viewAll}>View all comments</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert('Comment', 'Coming soon')}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>Add Your Thoughts</Text>
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
