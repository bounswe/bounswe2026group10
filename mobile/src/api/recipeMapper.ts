import type { Recipe } from '../types/recipe';
import type { AllergenTag, DietaryTag, MeasurementUnit, UserRole } from '../types/common';
import type { BackendRecipeDetail } from './recipes';

const ALLERGEN_MAP: Record<string, AllergenTag> = {
  peanuts: 'PEANUTS',
  dairy: 'DAIRY',
  shellfish: 'SHELLFISH',
  gluten: 'GLUTEN',
  tree_nuts: 'TREE_NUTS',
  'tree nuts': 'TREE_NUTS',
};

const DIETARY_TAG_MAP: Record<string, DietaryTag> = {
  vegan: 'VEGAN',
  vegetarian: 'VEGETARIAN',
  halal: 'HALAL',
  kosher: 'KOSHER',
  gluten_free: 'GLUTEN_FREE',
  'gluten-free': 'GLUTEN_FREE',
  hearty: 'HEARTY',
};

const VALID_UNITS = new Set<MeasurementUnit>([
  'g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'oz', 'lb',
]);

function toAllergenTag(raw: string): AllergenTag | null {
  return ALLERGEN_MAP[raw.toLowerCase()] ?? null;
}

function toDietaryTag(raw: string): DietaryTag | null {
  return DIETARY_TAG_MAP[raw.toLowerCase()] ?? null;
}

function toUnit(raw: string): MeasurementUnit {
  return VALID_UNITS.has(raw as MeasurementUnit) ? (raw as MeasurementUnit) : 'piece';
}

export function mapBackendRecipeToMobile(data: BackendRecipeDetail): Recipe {
  const images = data.media
    .filter((m) => m.type === 'image')
    .map((m) => m.url);

  const videoMedia = data.media.find((m) => m.type === 'video');

  const allergenSet = new Set<AllergenTag>();
  const ingredients = data.ingredients.map((ing) => {
    const ingAllergens: AllergenTag[] = [];
    for (const a of ing.allergens) {
      const tag = toAllergenTag(a);
      if (tag) {
        ingAllergens.push(tag);
        allergenSet.add(tag);
      }
    }
    return {
      id: ing.id,
      name: ing.ingredientName ?? '',
      quantity: ing.quantity,
      unit: toUnit(ing.unit),
      allergens: ingAllergens,
      substitutionAvailable: false,
      substitutes: [],
    };
  });

  const steps = data.steps
    .slice()
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => ({
      stepNumber: s.stepOrder,
      title: s.description,
      description: s.description,
      videoTimestamp: s.videoTimestamp ?? undefined,
    }));

  const tools = data.tools.map((t) => ({ id: t.id, name: t.name }));

  const tags: DietaryTag[] = [];
  for (const tag of data.tags) {
    if (tag.category === 'dietary' && tag.name) {
      const dt = toDietaryTag(tag.name);
      if (dt) tags.push(dt);
    }
  }

  const username = data.creatorUsername ?? '';
  const parts = username.split(/[_\s]+/);
  const firstName = parts[0] ?? username;
  const lastName = parts.slice(1).join(' ');

  const creatorRole: UserRole =
    data.type === 'cultural' ? 'EXPERT' : 'COOK';

  return {
    id: data.id,
    title: data.title,
    description: '',
    story: data.story ?? '',
    type: data.type === 'cultural' ? 'CULTURAL' : 'COMMUNITY',
    author: {
      id: data.creatorId ?? '',
      firstName,
      lastName,
      email: '',
      role: creatorRole,
      region: data.genreName ?? data.dishVarietyName ?? '',
      preferredLanguage: 'en',
    },
    images,
    videoUrl: videoMedia?.url ?? data.videoUrl ?? undefined,
    rating: data.averageRating ?? 0,
    ratingCount: data.ratingCount,
    prepTime: '',
    cookTime: '',
    servings: data.servingSize ?? 1,
    ingredients,
    tools,
    steps,
    origin: {
      country: data.genreName ?? data.dishVarietyName ?? '',
    },
    dishVarietyId: data.dishVarietyId != null ? String(data.dishVarietyId) : '',
    tags,
    allergens: Array.from(allergenSet),
    status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
