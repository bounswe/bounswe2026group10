import { addFavorite, getFavorites, removeFavorite } from '../api/recipes';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('addFavorite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POSTs /users/me/favorites/:id', async () => {
    mockFetchApi.mockResolvedValueOnce({ recipeId: 'r1', favorited: true } as any);
    const res = await addFavorite('r1');
    expect(mockFetchApi).toHaveBeenCalledWith('/users/me/favorites/r1', {
      method: 'POST',
    });
    expect(res).toEqual({ recipeId: 'r1', favorited: true });
  });

  it('treats 409 conflict as already-favorited success', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('409 Conflict: already in favorites'));
    const res = await addFavorite('r1');
    expect(res).toEqual({ recipeId: 'r1', favorited: true });
  });

  it('propagates other errors', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('500 server error'));
    await expect(addFavorite('r1')).rejects.toThrow('500 server error');
  });
});

describe('removeFavorite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('DELETEs /users/me/favorites/:id', async () => {
    mockFetchApi.mockResolvedValueOnce(null as any);
    await removeFavorite('r1');
    expect(mockFetchApi).toHaveBeenCalledWith('/users/me/favorites/r1', {
      method: 'DELETE',
    });
  });

  it('treats 404 not-found as success', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('404 Not Found'));
    await expect(removeFavorite('r1')).resolves.toBeUndefined();
  });

  it('propagates other errors', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('500 server error'));
    await expect(removeFavorite('r1')).rejects.toThrow('500 server error');
  });
});

describe('getFavorites', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GETs /users/me/favorites with defaults', async () => {
    mockFetchApi.mockResolvedValueOnce({
      recipes: [],
      pagination: { page: 1, limit: 20, total: 0 },
    } as any);
    await getFavorites();
    expect(mockFetchApi).toHaveBeenCalledWith('/users/me/favorites?page=1&limit=20');
  });

  it('forwards page and limit', async () => {
    mockFetchApi.mockResolvedValueOnce({
      recipes: [],
      pagination: { page: 3, limit: 50, total: 0 },
    } as any);
    await getFavorites(3, 50);
    expect(mockFetchApi).toHaveBeenCalledWith('/users/me/favorites?page=3&limit=50');
  });

  it('normalises backend recipe shape', async () => {
    mockFetchApi.mockResolvedValueOnce({
      recipes: [
        {
          id: 42,
          title: 'Baklava',
          type: 'cultural',
          averageRating: 4.7,
          ratingCount: 12,
          creatorId: 'u1',
          creatorUsername: 'elif',
          dishVarietyId: 7,
          dishVarietyName: 'Baklava',
          genreName: 'Pastries',
          coverImageUrl: 'http://img',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-02',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    } as any);

    const { recipes, pagination } = await getFavorites();
    expect(recipes[0]).toEqual({
      id: '42',
      title: 'Baklava',
      type: 'cultural',
      averageRating: 4.7,
      ratingCount: 12,
      creatorId: 'u1',
      creatorUsername: 'elif',
      dishVarietyId: 7,
      dishVarietyName: 'Baklava',
      genreName: 'Pastries',
      coverImageUrl: 'http://img',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    });
    expect(pagination).toEqual({ page: 1, limit: 20, total: 1 });
  });

  it('returns empty list when backend returns malformed payload', async () => {
    mockFetchApi.mockResolvedValueOnce(null as any);
    const { recipes, pagination } = await getFavorites();
    expect(recipes).toEqual([]);
    expect(pagination).toEqual({ page: 1, limit: 20, total: 0 });
  });
});
