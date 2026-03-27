import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Recipe, RecipeCard } from '../../types/recipe';
import { colors, spacing } from '../../theme';
import { useServingAdjuster } from '../../hooks/useServingAdjuster';
import { IconButton } from '../shared/IconButton';
import { HeroImage } from './HeroImage';
import { RecipeHeader } from './RecipeHeader';
import { StoryCard } from './StoryCard';
import { IngredientsSection } from './IngredientsSection';
import { ServingAdjuster } from './ServingAdjuster';
import { ToolsSection } from './ToolsSection';
import { StepsSection } from './StepsSection';
import { CookingModeButton } from './CookingModeButton';
import { RatingPrompt } from './RatingPrompt';
import { AlternativeVersions } from './AlternativeVersions';

interface RecipeDetailScreenProps {
  recipe: Recipe;
  alternatives: RecipeCard[];
}

export function RecipeDetailScreen({ recipe, alternatives }: RecipeDetailScreenProps) {
  const { servings, increment, decrement } = useServingAdjuster(recipe.servings);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton
          name="arrow-left"
          onPress={() => Alert.alert('Back', 'Navigation coming soon')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroImage imageUrl={recipe.images[0] ?? ''} />

        <RecipeHeader
          title={recipe.title}
          author={recipe.author}
          rating={recipe.rating}
          ratingCount={recipe.ratingCount}
          type={recipe.type}
          region={recipe.origin.city
            ? `${recipe.origin.city}, ${recipe.origin.country}`
            : recipe.origin.country}
          onAuthorPress={() => Alert.alert('Profile', 'Navigation coming soon')}
        />

        {recipe.story && <StoryCard story={recipe.story} />}

        <IngredientsSection
          ingredients={recipe.ingredients}
          baseServings={recipe.servings}
          servings={servings}
          servingAdjuster={
            <ServingAdjuster
              servings={servings}
              onIncrement={increment}
              onDecrement={decrement}
            />
          }
        />

        <ToolsSection tools={recipe.tools} />

        <StepsSection steps={recipe.steps} />

        <CookingModeButton />

        <AlternativeVersions cards={alternatives} />

        <RatingPrompt />
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
});
