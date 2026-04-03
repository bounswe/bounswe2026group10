import { searchIngredients } from '../api/ingredients';
import { getTools } from '../api/tools';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

beforeEach(() => jest.clearAllMocks());

describe('searchIngredients', () => {
  it('calls fetchApi with /ingredients when query is empty', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await searchIngredients('');
    expect(mockFetchApi).toHaveBeenCalledWith('/ingredients');
  });

  it('calls fetchApi with /ingredients when query is whitespace', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await searchIngredients('   ');
    expect(mockFetchApi).toHaveBeenCalledWith('/ingredients');
  });

  it('appends encoded search param when query has content', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await searchIngredients('flour');
    expect(mockFetchApi).toHaveBeenCalledWith('/ingredients?search=flour');
  });

  it('URL-encodes special characters in the query', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await searchIngredients('olive oil');
    expect(mockFetchApi).toHaveBeenCalledWith('/ingredients?search=olive%20oil');
  });

  it('returns the array resolved by fetchApi', async () => {
    const items = [{ id: 1, name: 'Salt', allergens: [] }];
    mockFetchApi.mockResolvedValueOnce(items as any);
    const result = await searchIngredients('salt');
    expect(result).toEqual(items);
  });
});

describe('getTools', () => {
  it('calls fetchApi with /tools', async () => {
    mockFetchApi.mockResolvedValueOnce([] as any);
    await getTools();
    expect(mockFetchApi).toHaveBeenCalledWith('/tools');
  });

  it('returns the array resolved by fetchApi', async () => {
    const tools = [{ name: 'Knife' }, { name: 'Pan' }];
    mockFetchApi.mockResolvedValueOnce(tools as any);
    const result = await getTools();
    expect(result).toEqual(tools);
  });
});
