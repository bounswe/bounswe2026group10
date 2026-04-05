/**
 * Mock data for integration tests.
 * Values use **backend snake_case** format — the service normalizers convert to camelCase.
 */

// ── Genres (10 to test pagination: GENRES_PER_PAGE = 8) ─────────────────────

export const mockGenres = [
  { id: 1, name: 'Soups', image_url: null },
  { id: 2, name: 'Desserts', image_url: null },
  { id: 3, name: 'Appetizers', image_url: null },
  { id: 4, name: 'Main Courses', image_url: null },
  { id: 5, name: 'Salads', image_url: null },
  { id: 6, name: 'Breads', image_url: null },
  { id: 7, name: 'Beverages', image_url: null },
  { id: 8, name: 'Pastries', image_url: null },
  { id: 9, name: 'Grills', image_url: null },
  { id: 10, name: 'Stews', image_url: null },
]

// ── Varieties ───────────────────────────────────────────────────────────────

export const mockVarieties = [
  { id: 1, name: 'Lentil Soup', genre_id: 1, dish_genre: { id: 1, name: 'Soups' }, region: 'Turkey', recipe_count: 3, image_url: null },
  { id: 2, name: 'Tomato Soup', genre_id: 1, dish_genre: { id: 1, name: 'Soups' }, region: 'Italy', recipe_count: 2, image_url: null },
  { id: 3, name: 'Baklava', genre_id: 2, dish_genre: { id: 2, name: 'Desserts' }, region: 'Turkey', recipe_count: 5, image_url: null },
  { id: 4, name: 'Hummus', genre_id: 3, dish_genre: { id: 3, name: 'Appetizers' }, region: 'Lebanon', recipe_count: 2, image_url: null },
  { id: 5, name: 'Tabbouleh', genre_id: 5, dish_genre: { id: 5, name: 'Salads' }, region: 'Lebanon', recipe_count: 1, image_url: null },
]

// ── Variety detail (for GET /dish-varieties/:id) ────────────────────────────

export const mockVarietyDetail = {
  id: 1,
  name: 'Lentil Soup',
  description: 'A hearty Turkish soup made with red lentils',
  genre_id: 1,
  dish_genre: { id: 1, name: 'Soups' },
  recipes: [
    { id: 101, title: "Grandma's Lentil Soup", type: 'cultural', average_rating: 4.5, rating_count: 12, region: 'Turkey', created_at: '2025-01-01T00:00:00Z' },
    { id: 102, title: 'Quick Red Lentil Soup', type: 'community', average_rating: 3.8, rating_count: 5, region: null, created_at: '2025-02-01T00:00:00Z' },
  ],
}

// ── Recipe detail (for GET /recipes/:id) ────────────────────────────────────

export const mockRecipeDetail = {
  id: 101,
  title: "Grandma's Lentil Soup",
  story: 'Passed down for three generations in our family.',
  videoUrl: null,
  servingSize: 4,
  type: 'cultural',
  isPublished: true,
  averageRating: 4.5,
  ratingCount: 12,
  creatorId: '99',
  creatorUsername: 'grandmachef',
  dishVarietyId: '1',
  dishVarietyName: 'Lentil Soup',
  genreName: 'Soups',
  ingredients: [
    { id: '1', ingredientId: '10', ingredientName: 'Red Lentils', quantity: 200, unit: 'g', allergens: [] },
    { id: '2', ingredientId: '11', ingredientName: 'Onion', quantity: 1, unit: 'piece', allergens: [] },
    { id: '3', ingredientId: '12', ingredientName: 'Butter', quantity: 30, unit: 'g', allergens: ['Dairy'] },
  ],
  steps: [
    { id: '1', stepOrder: 1, description: 'Wash and drain the lentils.' },
    { id: '2', stepOrder: 2, description: 'Saute onion in butter until translucent.' },
  ],
  tools: [{ id: '1', name: 'Large pot' }],
  media: [{ id: '1', url: '/img/soup.jpg', type: 'image' }],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-02T00:00:00Z',
}

// ── Dietary tags ───────��────────────────────────────────────────────────────

export const mockDietaryTags = [
  { id: 1, name: 'Vegan', category: 'dietary' },
  { id: 2, name: 'Gluten-Free', category: 'dietary' },
  { id: 3, name: 'Dairy', category: 'allergen' },
  { id: 4, name: 'Nuts', category: 'allergen' },
]

// ── Regions ───────────────────────────���─────────────────────────────────────

export const mockRegions = ['Turkey', 'Lebanon', 'Greece', 'Italy']

// ── Discovery recipe results (for GET /discovery/recipes) ───────────────────

export const mockDiscoveryRecipes = [
  {
    id: 101,
    title: "Grandma's Lentil Soup",
    type: 'cultural',
    average_rating: 4.5,
    rating_count: 12,
    created_at: '2025-01-01T00:00:00Z',
    image_url: null,
    profile: { username: 'grandmachef', role: 'expert' },
    dish_variety: { id: 1, name: 'Lentil Soup', region: 'Turkey', dish_genre: { id: 1, name: 'Soups' } },
  },
  {
    id: 102,
    title: 'Quick Red Lentil Soup',
    type: 'community',
    average_rating: 3.8,
    rating_count: 5,
    created_at: '2025-02-01T00:00:00Z',
    image_url: null,
    profile: { username: 'homecook', role: 'cook' },
    dish_variety: { id: 1, name: 'Lentil Soup', region: 'Turkey', dish_genre: { id: 1, name: 'Soups' } },
  },
]
