import { fetchCommunityPicks, fetchGenres } from '../api/home';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
  mockDelay: jest.fn().mockResolvedValue(undefined),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('fetchCommunityPicks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with GET /recipes and default pagination', async () => {
    const response = { recipes: [], pagination: { page: 1, limit: 10, total: 0 } };
    mockFetchApi.mockResolvedValueOnce(response);
    const result = await fetchCommunityPicks();
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes?page=1&limit=10');
    expect(result).toEqual(response);
  });

  it('passes custom page and limit parameters', async () => {
    const response = { recipes: [], pagination: { page: 2, limit: 5, total: 0 } };
    mockFetchApi.mockResolvedValueOnce(response);
    await fetchCommunityPicks(2, 5);
    expect(mockFetchApi).toHaveBeenCalledWith('/recipes?page=2&limit=5');
  });

  it('returns empty list when fetchApi rejects', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchCommunityPicks();
    expect(result.recipes).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

describe('fetchGenres', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls fetchApi with GET /dish-genres', async () => {
    const genres = [{ id: 1, name: 'Soups', description: null, varieties: [] }];
    mockFetchApi.mockResolvedValueOnce(genres);
    const result = await fetchGenres();
    expect(mockFetchApi).toHaveBeenCalledWith('/dish-genres');
    expect(result).toEqual(genres);
  });

  it('returns empty list when fetchApi rejects', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchGenres();
    expect(result).toEqual([]);
  });
});
