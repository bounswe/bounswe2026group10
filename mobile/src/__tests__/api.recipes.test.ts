import { createRecipe, publishRecipe, updateRecipe } from '../api/recipes';
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
