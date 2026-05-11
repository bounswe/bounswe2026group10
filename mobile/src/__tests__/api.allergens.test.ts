import { getAllergens, detectAllergens } from '../api/allergens';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

beforeEach(() => jest.clearAllMocks());

describe('getAllergens', () => {
  it('calls fetchApi with /allergens', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await getAllergens();
    expect(mockFetchApi).toHaveBeenCalledWith('/allergens');
  });

  it('returns the array resolved by fetchApi', async () => {
    const items = [
      { id: 1, name: 'Gluten' },
      { id: 2, name: 'Eggs' },
    ];
    mockFetchApi.mockResolvedValueOnce(items as any);
    const result = await getAllergens();
    expect(result).toEqual(items);
  });
});

describe('detectAllergens', () => {
  it('POSTs ingredientIds to /allergens/detect', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await detectAllergens([10, 11, 12]);
    expect(mockFetchApi).toHaveBeenCalledWith('/allergens/detect', {
      method: 'POST',
      body: JSON.stringify({ ingredientIds: [10, 11, 12] }),
    });
  });

  it('returns the array resolved by fetchApi', async () => {
    const detected = [{ id: 1, name: 'Gluten' }];
    mockFetchApi.mockResolvedValueOnce(detected as any);
    const result = await detectAllergens([10]);
    expect(result).toEqual(detected);
  });
});
