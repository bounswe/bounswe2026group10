import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Recipe, RecipeCard } from '../../types/recipe';
import { colors, spacing } from '../../theme';
import { useServingAdjuster } from '../../hooks/useServingAdjuster';
import { getRecipeById } from '../../api/recipes';
import { mapBackendRecipeToMobile } from '../../api/recipeMapper';
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
import { VideoGuideScreen } from '../video-guide/VideoGuideScreen';

interface RecipeDetailScreenProps {
  recipeId: string;
}

const EMPTY_ALTERNATIVES: RecipeCard[] = [];

export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoGuide, setShowVideoGuide] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRecipeById(recipeId)
      .then((data) => {
        console.log('[RecipeDetail] id:', data.id);
        console.log('[RecipeDetail] media:', JSON.stringify(data.media));
        setRecipe(mapBackendRecipeToMobile(data));
      })
      .catch((err: Error) => setError(err.message ?? 'Failed to load recipe'))
      .finally(() => setLoading(false));
  }, [recipeId]);

  const { servings, increment, decrement } = useServingAdjuster(recipe?.servings ?? 1);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Recipe not found'}</Text>
      </SafeAreaView>
    );
  }

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
          tags={recipe.tags}
          allergens={recipe.allergens}
          onAuthorPress={() => Alert.alert('Profile', 'Navigation coming soon')}
        />

        {recipe.story ? <StoryCard story={recipe.story} /> : null}

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

        <CookingModeButton onPress={() => setShowVideoGuide(true)} />

        <AlternativeVersions cards={EMPTY_ALTERNATIVES} />

        <RatingPrompt recipeId={recipeId} />
      </ScrollView>

      <Modal
        visible={showVideoGuide}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <VideoGuideScreen
          recipe={recipe}
          onClose={() => setShowVideoGuide(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.negative,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
