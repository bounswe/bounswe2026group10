import {
  searchDishVarieties,
  fetchSearchGenres,
  fetchDietaryTags,
  searchRecipesWithFilters,
  fetchDiscoveryRecipes,
} from '../api/search';
import { fetchApi } from '../api/client';


jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
  mockDelay: jest.fn().mockResolvedValue(undefined),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

// ─── searchDishVarieties ──────────────────────────────────────────────────────

describe('searchDishVarieties', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with /dish-varieties?search=query', async () => {
    mockFetchApi.mockResolvedValueOnce([]);
    await searchDishVarieties('kebap');
    expect(mockFetchApi).toHaveBeenCalledWith('/dish-varieties?search=kebap');
  });

  it('appends genreId when provided', async () => {
    mockFetchApi.mockResolvedValueOnce([]);
    await searchDishVarieties('soup', 1);
    const url = (mockFetchApi as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('search=soup');
    expect(url).toContain('genreId=1');
  });

  it('maps snake_case backend response to camelCase', async () => {
    const raw = [
      { id: 1, name: 'Adana', description: 'desc', genre_id: 4, dish_genre: { name: 'Kebabs' } },
    ];
    mockFetchApi.mockResolvedValueOnce(raw as any);
    const result = await searchDishVarieties('adana');
    expect(result[0]).toEqual({
      id: 1,
      name: 'Adana',
      description: 'desc',
      genreId: 4,
      genreName: 'Kebabs',
    });
  });

  it('returns empty array on error', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    const result = await searchDishVarieties('kebap');
    expect(result).toEqual([]);
  });
});

// ─── fetchSearchGenres ────────────────────────────────────────────────────────

describe('fetchSearchGenres', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /dish-genres', async () => {
    mockFetchApi.mockResolvedValueOnce([{ id: 1, name: 'Soups' }] as any);
    await fetchSearchGenres();
    expect(mockFetchApi).toHaveBeenCalledWith('/dish-genres');
  });

  it('returns all genres when no query provided', async () => {
    const fakeGenres = [{ id: 1, name: 'Soups' }, { id: 2, name: 'Mezes' }];
    mockFetchApi.mockResolvedValueOnce(fakeGenres as any);
    const result = await fetchSearchGenres();
    expect(result).toHaveLength(2);
  });

  it('filters genres by name query (case-insensitive)', async () => {
    const fakeGenres = [{ id: 1, name: 'Kebab' }, { id: 2, name: 'Soup' }];
    mockFetchApi.mockResolvedValueOnce(fakeGenres as any);
    const result = await fetchSearchGenres('kebab');
    expect(result.every((g) => g.name.toLowerCase().includes('kebab'))).toBe(true);
  });

  it('returns empty array on error', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('offline'));
    const result = await fetchSearchGenres('soup');
    expect(result).toEqual([]);
  });
});

// ─── fetchDietaryTags ─────────────────────────────────────────────────────────

describe('fetchDietaryTags', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /dietary-tags', async () => {
    mockFetchApi.mockResolvedValueOnce([]);
    await fetchDietaryTags();
    expect(mockFetchApi).toHaveBeenCalledWith('/dietary-tags');
  });

  it('maps response to DietaryTag interface', async () => {
    const raw = [
      { id: 1, name: 'Vegetarian', category: 'dietary' },
      { id: 2, name: 'Peanuts', category: 'allergen' },
    ];
    mockFetchApi.mockResolvedValueOnce(raw);
    const result = await fetchDietaryTags();
    expect(result).toEqual(raw);
  });

  it('returns empty array on error', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('offline'));
    const result = await fetchDietaryTags();
    expect(result).toEqual([]);
  });
});

// ─── searchRecipesWithFilters ────────────────────────────────────────────────

describe('searchRecipesWithFilters', () => {
  beforeEach(() => jest.clearAllMocks());


  it('calls /discovery/recipes with exclude allergens', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await searchRecipesWithFilters('', { excludeAllergenIds: [1, 2] });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0];
    expect(call).toContain('excludeAllergens=1%2C2');
  });

  it('calls /discovery/recipes with dietary tags', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await searchRecipesWithFilters('', { dietaryTagIds: [1, 3] });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0];
    expect(call).toContain('tagIds=1%2C3');
  });

  it('resolves query to varietyId before calling discovery', async () => {
    mockFetchApi
      .mockResolvedValueOnce([{ id: 5, name: 'Adana' }])
      .mockResolvedValueOnce({ recipes: [] });
    await searchRecipesWithFilters('adana', {});
    const secondCall = (mockFetchApi as jest.Mock).mock.calls[1][0];
    expect(secondCall).toContain('varietyId=5');
  });

  it('maps backend response to Recipe interface', async () => {
    const raw = [
      {
        id: '1',
        title: 'My Kebab',
        profile: { username: 'chef' },
        average_rating: 4.5,
        rating_count: 10,
        dish_variety_id: 5,
        dish_variety: { name: 'Adana' },
        type: 'cultural',
        image_url: 'https://example.com/image.jpg',
      },
    ];
    mockFetchApi.mockResolvedValueOnce({ recipes: raw });
    const result = await searchRecipesWithFilters('', {});
    expect(result[0]).toEqual({
      id: '1',
      title: 'My Kebab',
      creatorUsername: 'chef',
      averageRating: 4.5,
      ratingCount: 10,
      dishVarietyId: 5,
      varietyName: 'Adana',
      recipeType: 'cultural',
      imageUrl: 'https://example.com/image.jpg',
    });
  });

  it('returns empty array on error', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    const result = await searchRecipesWithFilters('kebap', {});
    expect(result).toEqual([]);
  });
});

// ─── fetchDiscoveryRecipes ────────────────────────────────────────────────────

describe('fetchDiscoveryRecipes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls /discovery/recipes with search param directly (no variety resolution)', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await fetchDiscoveryRecipes({ search: 'lentil' });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0] as string;
    expect(call).toContain('search=lentil');
    // Must be a single API call — no variety resolution step
    expect(mockFetchApi).toHaveBeenCalledTimes(1);
  });

  it('passes genreId param', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await fetchDiscoveryRecipes({ genreId: 3 });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0] as string;
    expect(call).toContain('genreId=3');
  });

  it('passes country and city params', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await fetchDiscoveryRecipes({ country: 'Turkey', city: 'Istanbul' });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0] as string;
    expect(call).toContain('country=Turkey');
    expect(call).toContain('city=Istanbul');
  });

  it('passes excludeAllergens and tagIds params', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipes: [] });
    await fetchDiscoveryRecipes({ excludeAllergenIds: [1, 2], dietaryTagIds: [5] });
    const call = (mockFetchApi as jest.Mock).mock.calls[0][0] as string;
    expect(call).toContain('excludeAllergens=1%2C2');
    expect(call).toContain('tagIds=5');
  });

  it('maps backend response to Recipe interface', async () => {
    const raw = [
      {
        id: 'r1',
        title: 'Mercimek Çorbası',
        profile: { username: 'anadolu_chef' },
        average_rating: 4.8,
        rating_count: 22,
        dish_variety_id: 7,
        dish_variety: { id: 7, name: 'Lentil Soup' },
        type: 'cultural',
        image_url: null,
      },
    ];
    mockFetchApi.mockResolvedValueOnce({ recipes: raw });
    const result = await fetchDiscoveryRecipes({ search: 'mercimek' });
    expect(result[0]).toEqual({
      id: 'r1',
      title: 'Mercimek Çorbası',
      creatorUsername: 'anadolu_chef',
      averageRating: 4.8,
      ratingCount: 22,
      dishVarietyId: 7,
      varietyName: 'Lentil Soup',
      recipeType: 'cultural',
      imageUrl: null,
    });
  });

  it('returns empty array on error', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchDiscoveryRecipes({ search: 'test' });
    expect(result).toEqual([]);
  });
});
