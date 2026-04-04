import type { RecipeFormState } from '../context/RecipeFormContext';

export function buildRecipePayload(draft: RecipeFormState) {
  return {
    title: draft.title,
    type: draft.type.toLowerCase() as 'community' | 'cultural',
    story: draft.story || undefined,
    dishVarietyId: draft.varietyId ?? undefined,
    servingSize: draft.servingSize,
    videoUrl: draft.videoUrl ?? undefined,
    tagIds: [...draft.dietaryTagIds, ...draft.allergenTagIds],
    ingredients: draft.ingredients
      .filter((ing) => ing.name.trim() && ing.ingredientId !== null)
      .map((ing) => ({
        ingredientId: ing.ingredientId as number,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
      })),
    steps: draft.steps.map((s, i) => {
      let videoTimestamp: number | null = null;
      if (s.timestamp.trim()) {
        const [mm, ss] = s.timestamp.split(':').map(Number);
        videoTimestamp = mm * 60 + ss;
      }
      return {
        stepOrder: i + 1,
        description: s.description,
        videoTimestamp,
      };
    }),
    tools: draft.tools.map((t) => ({ name: t.name })),
  };
}
