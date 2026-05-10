import { parseRecipeText, parseRecipeAudio } from '../api/parse';
import { fetchApi } from '../api/client';

jest.mock('../api/client', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

beforeEach(() => jest.clearAllMocks());

describe('parseRecipeText', () => {
  it('posts text to /parse/recipe-text', async () => {
    mockFetchApi.mockResolvedValueOnce({
      title: 'Test',
      ingredients: [],
      steps: [],
      tools: [],
    } as any);

    await parseRecipeText('Some recipe text here');

    expect(mockFetchApi).toHaveBeenCalledWith('/parse/recipe-text', {
      method: 'POST',
      body: JSON.stringify({ text: 'Some recipe text here' }),
    });
  });

  it('returns the parsed recipe', async () => {
    const payload = {
      title: 'Börek',
      ingredients: [{ name: 'flour', quantity: 2, unit: 'cup' }],
      steps: [{ stepOrder: 1, description: 'Mix flour' }],
      tools: [{ name: 'rolling pin' }],
    };
    mockFetchApi.mockResolvedValueOnce(payload as any);
    await expect(parseRecipeText('some text')).resolves.toEqual(payload);
  });

  it('propagates ApiError on failure', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('PARSE_FAILED'));
    await expect(parseRecipeText('some text')).rejects.toThrow('PARSE_FAILED');
  });
});

describe('parseRecipeAudio', () => {
  it('posts multipart form to /parse/recipe-audio with default language auto', async () => {
    mockFetchApi.mockResolvedValueOnce({
      transcription: { text: 'Recipe text', languageCode: 'en', languageProbability: 0.99, truncated: false, source: 'audio' },
      recipe: { title: 'Test', ingredients: [], steps: [], tools: [] },
    } as any);

    await parseRecipeAudio('file:///tmp/recording.m4a');

    expect(mockFetchApi).toHaveBeenCalledWith('/parse/recipe-audio', {
      method: 'POST',
      body: expect.any(FormData),
    });

    const call = mockFetchApi.mock.calls[0];
    const formData = call[1]?.body as FormData;
    expect((formData as any).getParts?.() ?? formData).toBeTruthy();
  });

  it('uses the provided language parameter', async () => {
    mockFetchApi.mockResolvedValueOnce({
      transcription: { text: 'Tarif metni', languageCode: 'tr', languageProbability: 0.97, truncated: false, source: 'audio' },
      recipe: { title: 'Test', ingredients: [], steps: [], tools: [] },
    } as any);

    await parseRecipeAudio('file:///tmp/recording.m4a', 'tr');

    expect(mockFetchApi).toHaveBeenCalledWith('/parse/recipe-audio', {
      method: 'POST',
      body: expect.any(FormData),
    });
  });

  it('returns the full transcription and recipe response', async () => {
    const payload = {
      transcription: {
        text: 'Mix two cups of flour',
        languageCode: 'en',
        languageProbability: 0.99,
        truncated: false,
        source: 'audio' as const,
      },
      recipe: {
        title: 'Bread',
        ingredients: [{ name: 'flour', quantity: 2, unit: 'cup' }],
        steps: [{ stepOrder: 1, description: 'Mix flour' }],
        tools: [],
      },
    };
    mockFetchApi.mockResolvedValueOnce(payload as any);
    await expect(parseRecipeAudio('file:///tmp/rec.m4a')).resolves.toEqual(payload);
  });

  it('propagates error on transcription failure', async () => {
    mockFetchApi.mockRejectedValueOnce(new Error('TRANSCRIPTION_FAILED'));
    await expect(parseRecipeAudio('file:///tmp/rec.m4a')).rejects.toThrow('TRANSCRIPTION_FAILED');
  });
});
