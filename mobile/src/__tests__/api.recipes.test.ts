import { createRecipe, deleteRecipe, getMyRecipes, publishRecipe, updateRecipe } from '../api/recipes';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

const minimalParams = {
  title: 'Test Recipe',
  type: 'community' as const,
  ingredients: [],
  steps: [],
  tools: [],
};

describe('createRecipe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with POST /recipes and serialised body', async () => {
    mockFetchApi.mockResolvedValueOnce({ id: 'abc' } as any);
    await createRecipe(minimalParams);
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes', {
      method: 'POST',
      body: JSON.stringify(minimalParams),
    });
  });

  it('returns the resolved value from fetchApi', async () => {
    const response = { id: 'abc', title: 'Test Recipe' };
    mockFetchApi.mockResolvedValueOnce(response as any);
    const result = await createRecipe(minimalParams);
    expect(result).toEqual(response);
  });

  it('propagates errors thrown by fetchApi', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    await expect(createRecipe(minimalParams)).rejects.toThrow('Network error');
  });
});

describe('publishRecipe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with POST /recipes/:id/publish', async () => {
    mockFetchApi.mockResolvedValueOnce({ id: 'abc', isPublished: true } as any);
    await publishRecipe('abc');
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/abc/publish', { method: 'POST' });
  });

  it('returns the published recipe response', async () => {
    mockFetchApi.mockResolvedValueOnce({ id: 'abc', isPublished: true });
    const result = await publishRecipe('abc');
    expect(result).toEqual({ id: 'abc', isPublished: true });
  });
});

describe('updateRecipe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with PATCH /recipes/:id and serialised body', async () => {
    mockFetchApi.mockResolvedValueOnce({ message: 'updated', id: 'abc' });
    await updateRecipe('abc', { title: 'Updated' });
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/abc', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
  });
});

describe('deleteRecipe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with DELETE /recipes/:id', async () => {
    mockFetchApi.mockResolvedValueOnce(null as any);
    await deleteRecipe('abc');
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/abc', { method: 'DELETE' });
  });
});

describe('getMyRecipes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls /recipes/mine without query when no status provided', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await getMyRecipes();
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/mine');
  });

  it('appends status query param when provided', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await getMyRecipes('draft');
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes/mine?status=draft');
  });

  it('normalises backend shape into MyRecipeSummary', async () => {
    mockFetchApi.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Börek',
        type: 'cultural',
        isPublished: true,
        averageRating: 4.5,
        ratingCount: 10,
        country: 'Turkey',
        city: 'Istanbul',
        district: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        coverImageUrl: 'http://img',
      },
    ] as any);
    const res = await getMyRecipes();
    expect(res).toEqual([
      {
        id: '1',
        title: 'Börek',
        type: 'cultural',
        isPublished: true,
        averageRating: 4.5,
        ratingCount: 10,
        country: 'Turkey',
        city: 'Istanbul',
        district: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        coverImageUrl: 'http://img',
      },
    ]);
  });

  it('returns empty array if backend returns non-array', async () => {
    mockFetchApi.mockResolvedValueOnce(null as any);
    const res = await getMyRecipes();
    expect(res).toEqual([]);
  });
});
