import type { BackendRecipeDetail } from '../api/recipes';
import type { RecipeFormState } from '../context/RecipeFormContext';

export function mapBackendToDraft(recipe: BackendRecipeDetail): RecipeFormState {
  const dietaryTags = recipe.tags.filter(t => t.category === 'dietary');
  const topLevelAllergens = recipe.allergens ?? [];

  return {
    recipeId: recipe.id,
    isAlreadyPublished: recipe.isPublished,
    title: recipe.title,
    type: recipe.type === 'cultural' ? 'CULTURAL' : 'COMMUNITY',
    originCountry: recipe.country || '',
    originCity: recipe.city || '',
    originDistrict: recipe.district || '',
    genreId: null,
    varietyId: recipe.dishVarietyId,
    dietaryTagIds: dietaryTags.map(t => t.id).filter(Boolean) as number[],
    dietaryTagNames: dietaryTags.map(t => t.name).filter(Boolean) as string[],
    allergenTagIds: topLevelAllergens.map(a => a.id).filter(Boolean) as number[],
    allergenTagNames: topLevelAllergens.map(a => a.name).filter(Boolean) as string[],
    culturalTagIds: [], // Not supported fully in backend yet
    culturalTags: [],
    story: recipe.story || '',
    servingSize: recipe.servingSize || undefined,
    ingredients: recipe.ingredients.map(ing => ({
      id: ing.id,
      ingredientId: ing.ingredientId,
      name: ing.ingredientName || '',
      quantity: String(ing.quantity || ''),
      unit: ing.unit || 'g',
    })),
    tools: recipe.tools.map(t => ({ id: t.id, name: t.name })),
    imageUrls: recipe.media.filter(m => m.type === 'image').map(m => m.url),
    videoUrl: recipe.media.find(m => m.type === 'video')?.url || null,
    videoFileName: recipe.media.find(m => m.type === 'video') ? 'video.mp4' : null,
    steps: recipe.steps.map(s => {
      let timestamp = '';
      if (s.videoTimestamp) {
        const mm = Math.floor(s.videoTimestamp / 60).toString().padStart(2, '0');
        const ss = (s.videoTimestamp % 60).toString().padStart(2, '0');
        timestamp = `${mm}:${ss}`;
      }
      return {
        id: s.id,
        description: s.description,
        timestamp,
        isExpanded: false
      };
    })
  };
}
