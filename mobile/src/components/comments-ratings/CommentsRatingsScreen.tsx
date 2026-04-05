import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '../../theme';
import { StarRating } from '../shared/StarRating';
import { IconButton } from '../shared/IconButton';
import { SectionHeader } from '../shared/SectionHeader';
import { useAuth } from '../../context/AuthContext';
import { getUserRating, rateRecipe, deleteUserRating } from '../../api/recipes';

interface CommentsRatingsScreenProps {
  recipeId: string;
  recipeTitle: string;
  rating: number;
  ratingCount: number;
  creatorUsername?: string;
}

export function CommentsRatingsScreen({
  recipeId,
  recipeTitle,
  rating,
  ratingCount,
  creatorUsername,
}: CommentsRatingsScreenProps) {
  const navigation = useNavigation();
  const { authState } = useAuth();
  const isAuthenticated = authState.status === 'authenticated';
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserRating(recipeId)
      .then((r) => { if (r) setSelectedRating(r.score); })
      .catch(() => {});
  }, [recipeId, isAuthenticated]);

  const handleStarPress = async (score: number) => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Please log in to rate this recipe.');
      return;
    }
    if (isAuthenticated && authState.user.username === creatorUsername) {
      Alert.alert('Rating', 'You cannot rate your own recipe.');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit rating';
      Alert.alert('Rating', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.title} numberOfLines={1}>{recipeTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.averageNumber}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
          <StarRating rating={rating} size={28} />
          <Text style={styles.ratingCount}>{ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</Text>
        </View>

        <SectionHeader title="Your Rating">
          <View style={styles.yourRatingSection}>
            <Text style={styles.yourRatingHeading}>How did it turn out?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={36}
                    color={colors.starYellow}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {selectedRating > 0 && (
              <Text style={styles.tapToRemove}>Tap your rating again to remove it</Text>
            )}
          </View>
        </SectionHeader>

        <SectionHeader title="Comments">
          <View style={styles.commentsPlaceholder}>
            <Text style={styles.commentsPlaceholderText}>Comments coming soon</Text>
          </View>
        </SectionHeader>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.lg,
    color: colors.onSurface,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  averageNumber: {
    fontFamily: fonts.serifBold,
    fontSize: 48,
    color: colors.onSurface,
    lineHeight: 56,
  },
  ratingCount: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  yourRatingSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  yourRatingHeading: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tapToRemove: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },
  commentsPlaceholder: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  commentsPlaceholderText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
});
