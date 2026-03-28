import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StarRating } from '../shared/StarRating';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface RatingPromptProps {
  onViewComments?: () => void;
}

export function RatingPrompt({ onViewComments }: RatingPromptProps) {
  const handleViewComments =
    onViewComments ?? (() => Alert.alert('Comments', 'Coming soon'));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How did it turn out?</Text>

      <View style={styles.ratingRow}>
        <StarRating rating={0} size={28} />
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
