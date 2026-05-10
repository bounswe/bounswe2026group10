import { getCulturalTags, pickCulturalTagLabel } from '../api/cultural-tags';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('getCulturalTags', () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
  });

  it('calls /cultural-tags without query params when no country given', async () => {
    mockedFetchApi.mockResolvedValueOnce([]);
    await getCulturalTags();
    expect(mockedFetchApi).toHaveBeenCalledWith('/cultural-tags');
  });

  it('passes country as a query param', async () => {
    mockedFetchApi.mockResolvedValueOnce([]);
    await getCulturalTags('Turkey');
    expect(mockedFetchApi).toHaveBeenCalledWith('/cultural-tags?country=Turkey');
  });

  it('URL-encodes countries with special characters', async () => {
    mockedFetchApi.mockResolvedValueOnce([]);
    await getCulturalTags('United Kingdom');
    expect(mockedFetchApi).toHaveBeenCalledWith(
      '/cultural-tags?country=United%20Kingdom',
    );
  });

  it('treats empty string as no country', async () => {
    mockedFetchApi.mockResolvedValueOnce([]);
    await getCulturalTags('');
    expect(mockedFetchApi).toHaveBeenCalledWith('/cultural-tags');
  });

  it('returns the array resolved by fetchApi', async () => {
    const tags = [
      { id: 1, key: 'wedding', labelEn: 'Wedding', labelTr: 'Düğün', country: null },
    ];
    mockedFetchApi.mockResolvedValueOnce(tags);
    await expect(getCulturalTags()).resolves.toEqual(tags);
  });

  it('falls back to [] and logs when fetchApi rejects', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedFetchApi.mockRejectedValueOnce(new Error('network down'));
    await expect(getCulturalTags('Turkey')).resolves.toEqual([]);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('pickCulturalTagLabel', () => {
  const tag = {
    id: 1,
    key: 'wedding',
    labelEn: 'Wedding',
    labelTr: 'Düğün',
    country: null,
  };

  it('returns the English label for en locale', () => {
    expect(pickCulturalTagLabel(tag, 'en')).toBe('Wedding');
  });

  it('returns the Turkish label for tr locale', () => {
    expect(pickCulturalTagLabel(tag, 'tr')).toBe('Düğün');
  });

  it('falls back to English for unknown locales', () => {
    expect(pickCulturalTagLabel(tag, 'de')).toBe('Wedding');
  });
});
