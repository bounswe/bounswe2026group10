import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Recipe, RecipeCard } from '../../types/recipe';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface RecipeDetailScreenProps {
  recipe: Recipe;
  alternatives: RecipeCard[];
}

export function RecipeDetailScreen({ recipe }: RecipeDetailScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.subtitle}>
          by {recipe.author.firstName} {recipe.author.lastName}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.lg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
});
