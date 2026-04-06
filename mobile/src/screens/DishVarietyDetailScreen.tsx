import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, fontSizes, spacing } from '../theme';
import { RecipeCard } from '../components/search/RecipeCard';
import { fetchApi } from '../api/client';

// Types
interface DishVarietyDetail {
  id: number;
  name: string;
  description: string | null;
  genre: {
    id: number;
    name: string;
  } | null;
  recipes: VarietyRecipeSummary[];
}

interface VarietyRecipeSummary {
  id: string;
  title: string;
  type: 'cultural' | 'community';
  averageRating: number | null;
  ratingCount: number;
  createdAt: string;
}

interface RecipeDetail {
  id: string;
  title: string;
  story: string | null;
  media: { type: 'image' | 'video'; url: string }[];
  profile: { username: string };
}

type NavigationProp = NativeStackNavigationProp<any>;
type RoutePropType = RouteProp<any, any>;

interface CulturalSpotlightProps {
  recipe: VarietyRecipeSummary;
  description: string | null;
  imageUrl: string | null;
  onPress: () => void;
}

function CulturalSpotlight({
  recipe,
  description,
  imageUrl,
  onPress,
}: CulturalSpotlightProps) {
  return (
    <View style={styles.spotlight}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.spotlightImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.spotlightLabel}>
        <Text style={styles.spotlightLabelText}>CULTURAL SPOTLIGHT</Text>
      </View>

      <Text style={styles.spotlightTitle}>{recipe.title}</Text>

      <View style={styles.spotlightMeta}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>CULTURAL</Text>
        </View>
        {recipe.averageRating != null && (
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color={colors.tertiary} />
            <Text style={styles.ratingText}>{recipe.averageRating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({recipe.ratingCount})</Text>
          </View>
        )}
      </View>

      <Text style={styles.spotlightDescription}>
        {description?.trim() || 'No description available'}
      </Text>

      <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
        <Text style={styles.ctaButtonText}>View Recipe</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DishVarietyDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const varietyId = route.params?.id;

  const [variety, setVariety] = useState<DishVarietyDetail | null>(null);
  const [featuredDescription, setFeaturedDescription] = useState<string | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [communityImageMap, setCommunityImageMap] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch variety details
  useEffect(() => {
    if (!varietyId) return;
    setLoading(true);
    fetchApi<DishVarietyDetail>(`/dish-varieties/${varietyId}`)
      .then(setVariety)
      .catch(() => setError('Failed to load dish variety'))
      .finally(() => setLoading(false));
  }, [varietyId]);

  // Fetch cultural recipe details (story + image)
  useEffect(() => {
    const culturalRecipeId = variety?.recipes.find((recipe) => recipe.type === 'cultural')?.id;
    if (!culturalRecipeId) {
      setFeaturedDescription(null);
      setFeaturedImageUrl(null);
      return;
    }

    let cancelled = false;
    fetchApi<RecipeDetail>(`/recipes/${culturalRecipeId}`)
      .then((recipe) => {
        if (!cancelled) {
          setFeaturedDescription(recipe.story ?? null);
          const firstImage = recipe.media.find((item) => item.type === 'image');
          setFeaturedImageUrl(firstImage?.url ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeaturedDescription(null);
          setFeaturedImageUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [variety?.recipes]);

  // Fetch community recipe images
  useEffect(() => {
    const communityIds =
      variety?.recipes.filter((recipe) => recipe.type === 'community').map((recipe) => recipe.id) ?? [];

    if (communityIds.length === 0) {
      setCommunityImageMap({});
      return;
    }

    let cancelled = false;

    Promise.all(
      communityIds.map(async (recipeId) => {
        try {
          const detail = await fetchApi<RecipeDetail>(`/recipes/${recipeId}`);
          const firstImage = detail.media.find((item) => item.type === 'image');
          return [recipeId, firstImage?.url ?? null] as const;
        } catch {
          return [recipeId, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setCommunityImageMap(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [variety?.recipes]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (error || !variety) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error ?? 'Dish variety not found'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const culturalRecipe = variety.recipes.find((recipe) => recipe.type === 'cultural') ?? null;
  const communityRecipes = variety.recipes.filter((recipe) => recipe.type === 'community');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backNav}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        <Text style={styles.backNavText}>Back</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {variety.genre && (
            <View style={styles.genreChip}>
              <Text style={styles.genreChipText}>{variety.genre.name}</Text>
            </View>
          )}
          <Text style={styles.title}>{variety.name}</Text>
          {variety.description && (
            <Text style={styles.description}>{variety.description}</Text>
          )}
        </View>

        {/* Recipes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recipes ({variety.recipes.length})
          </Text>

          {variety.recipes.length === 0 ? (
            <Text style={styles.emptyText}>No recipes available</Text>
          ) : (
            <>
              {/* Cultural Recipe Spotlight */}
              {culturalRecipe && (
                <CulturalSpotlight
                  recipe={culturalRecipe}
                  description={featuredDescription}
                  imageUrl={featuredImageUrl}
                  onPress={() =>
                    navigation.navigate('RecipeDetail', { recipeId: culturalRecipe.id })
                  }
                />
              )}

              {/* Community Recipes */}
              {communityRecipes.length > 0 ? (
                <View>
                  <Text style={styles.subsectionTitle}>Community Recipes</Text>
                  <View style={styles.recipesList}>
                    {communityRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={{
                          id: recipe.id,
                          title: recipe.title,
                          creatorUsername: 'Community',
                          averageRating: recipe.averageRating ?? 0,
                          ratingCount: recipe.ratingCount,
                          dishVarietyId: variety.id,
                          varietyName: variety.name,
                          recipeType: 'community',
                          imageUrl: communityImageMap[recipe.id] ?? null,
                        }}
                        onPress={() =>
                          navigation.navigate('RecipeDetail', { recipeId: recipe.id })
                        }
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No community recipes yet</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
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
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  backNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backNavText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurface,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genreChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  genreChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['3xl'],
    color: colors.onSurface,
    lineHeight: 32,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes.xl,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
  },
  spotlight: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  spotlightImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  spotlightLabel: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  spotlightLabelText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xs,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  spotlightTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSizes['2xl'],
    color: colors.onSurface,
    lineHeight: 28,
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: colors.tertiary,
    borderRadius: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typeBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSizes.xs,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  spotlightDescription: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.md,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ctaButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.md,
    color: colors.white,
  },
  recipesList: {
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
