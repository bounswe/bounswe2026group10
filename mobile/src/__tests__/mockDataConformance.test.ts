import { mockRecipe } from '../data/mockRecipe';
import { mockAlternatives } from '../data/mockAlternatives';

const VALID_RECIPE_TYPES = ['COMMUNITY', 'CULTURAL'];
const VALID_RECIPE_STATUSES = ['PUBLISHED', 'DRAFT'];
const VALID_USER_ROLES = ['LEARNER', 'COOK', 'EXPERT'];
const VALID_DIETARY_TAGS = ['VEGAN', 'VEGETARIAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE', 'HEARTY'];
const VALID_ALLERGEN_TAGS = ['PEANUTS', 'DAIRY', 'SHELLFISH', 'GLUTEN', 'TREE_NUTS'];
const VALID_UNITS = ['g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'oz', 'lb'];

describe('mockRecipe conformance', () => {
  it('has all required top-level fields', () => {
    expect(mockRecipe.id).toBeTruthy();
    expect(mockRecipe.title).toBeTruthy();
    expect(mockRecipe.description).toBeTruthy();
    expect(mockRecipe.story).toBeTruthy();
    expect(mockRecipe.servings).toBeGreaterThan(0);
    expect(mockRecipe.rating).toBeGreaterThanOrEqual(0);
    expect(mockRecipe.rating).toBeLessThanOrEqual(5);
    expect(mockRecipe.ratingCount).toBeGreaterThanOrEqual(0);
    expect(mockRecipe.images.length).toBeGreaterThan(0);
    expect(mockRecipe.createdAt).toBeTruthy();
    expect(mockRecipe.updatedAt).toBeTruthy();
  });

  it('has a valid recipe type and status', () => {
    expect(VALID_RECIPE_TYPES).toContain(mockRecipe.type);
    expect(VALID_RECIPE_STATUSES).toContain(mockRecipe.status);
  });

  it('has a valid author with all required fields', () => {
    const { author } = mockRecipe;
    expect(author.id).toBeTruthy();
    expect(author.firstName).toBeTruthy();
    expect(author.lastName).toBeTruthy();
    expect(author.email).toBeTruthy();
    expect(VALID_USER_ROLES).toContain(author.role);
    expect(author.region).toBeTruthy();
    expect(author.preferredLanguage).toBeTruthy();
    expect(author.memberSince).toBeTruthy();
  });

  it('has a valid origin', () => {
    expect(mockRecipe.origin.country).toBeTruthy();
  });

  it('has valid dietary tags', () => {
    mockRecipe.tags.forEach((tag) => {
      expect(VALID_DIETARY_TAGS).toContain(tag);
    });
  });

  it('has valid allergen tags', () => {
    mockRecipe.allergens.forEach((allergen) => {
      expect(VALID_ALLERGEN_TAGS).toContain(allergen);
    });
  });

  it('has ingredients with valid fields', () => {
    expect(mockRecipe.ingredients.length).toBeGreaterThan(0);
    mockRecipe.ingredients.forEach((ing) => {
      expect(ing.id).toBeTruthy();
      expect(ing.name).toBeTruthy();
      expect(ing.quantity).toBeGreaterThan(0);
      expect(VALID_UNITS).toContain(ing.unit);
      expect(Array.isArray(ing.allergens)).toBe(true);
      expect(typeof ing.substitutionAvailable).toBe('boolean');
    });
  });

  it('has tools with valid fields', () => {
    expect(mockRecipe.tools.length).toBeGreaterThan(0);
    mockRecipe.tools.forEach((tool) => {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
    });
  });

  it('has steps in sequential order with valid fields', () => {
    expect(mockRecipe.steps.length).toBeGreaterThan(0);
    mockRecipe.steps.forEach((step, index) => {
      expect(step.stepNumber).toBe(index + 1);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
    });
  });

  it('has video URLs on all steps', () => {
    mockRecipe.steps.forEach((step) => {
      expect(step.videoUrl).toBeTruthy();
    });
  });
});

describe('mockAlternatives conformance', () => {
  it('has at least one alternative recipe card', () => {
    expect(mockAlternatives.length).toBeGreaterThan(0);
  });

  it('each card has all required fields', () => {
    mockAlternatives.forEach((card) => {
      expect(card.id).toBeTruthy();
      expect(card.title).toBeTruthy();
      expect(card.thumbnailUrl).toBeTruthy();
      expect(card.author.id).toBeTruthy();
      expect(card.author.firstName).toBeTruthy();
      expect(card.author.lastName).toBeTruthy();
      expect(card.rating).toBeGreaterThanOrEqual(0);
      expect(card.rating).toBeLessThanOrEqual(5);
      expect(card.region).toBeTruthy();
      expect(card.dishVarietyId).toBeTruthy();
      expect(card.dishVarietyName).toBeTruthy();
      expect(VALID_RECIPE_TYPES).toContain(card.type);
      expect(VALID_RECIPE_STATUSES).toContain(card.status);
    });
  });

  it('all alternative cards share the same dish variety as the main recipe', () => {
    mockAlternatives.forEach((card) => {
      expect(card.dishVarietyId).toBe(mockRecipe.dishVarietyId);
    });
  });
});
