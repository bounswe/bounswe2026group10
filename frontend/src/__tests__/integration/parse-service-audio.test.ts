import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { parseService } from '@/services/parse-service'

const BASE = 'http://localhost/api'

describe('parseService.parseRecipeAudio()', () => {
  it('hits POST /parse/recipe-audio with multipart content-type', async () => {
    let contentType: string | null = null
    let bodyPresent = false

    server.use(
      http.post(`${BASE}/parse/recipe-audio`, async ({ request }) => {
        contentType = request.headers.get('content-type')
        bodyPresent = request.body !== null
        return HttpResponse.json({
          success: true,
          data: {
            transcription: {
              text: 'Heat olive oil. Add onions.',
              languageCode: 'en',
              languageProbability: 0.97,
              truncated: false,
              source: 'audio',
            },
            recipe: {
              title: 'Caramelized Onions',
              ingredients: [{ name: 'onion', quantity: 2, unit: 'pcs' }],
              steps: [{ stepOrder: 1, description: 'Heat oil and add onions.' }],
              tools: ['Pan'],
            },
          },
          error: null,
        })
      }),
    )

    const blob = new Blob(['fake audio'], { type: 'audio/webm' })
    const result = await parseService.parseRecipeAudio(blob, 'en', 'cooking.webm')

    expect(contentType).toMatch(/multipart\/form-data/)
    expect(bodyPresent).toBe(true)

    expect(result.transcription.text).toBe('Heat olive oil. Add onions.')
    expect(result.transcription.languageCode).toBe('en')
    expect(result.transcription.source).toBe('audio')
    expect(result.recipe.title).toBe('Caramelized Onions')
    expect(result.recipe.ingredients).toHaveLength(1)
    expect(result.recipe.ingredients[0].name).toBe('onion')
    expect(result.recipe.steps).toHaveLength(1)
    expect(result.recipe.tools).toEqual(['Pan'])
  })

  it('normalizes a response with truncated=true and source=video', async () => {
    server.use(
      http.post(`${BASE}/parse/recipe-audio`, () =>
        HttpResponse.json({
          success: true,
          data: {
            transcription: {
              text: 'Long video transcript...',
              languageCode: 'tr',
              languageProbability: 0.95,
              truncated: true,
              source: 'video',
            },
            recipe: { title: 'V', ingredients: [], steps: [], tools: [] },
          },
          error: null,
        }),
      ),
    )

    const result = await parseService.parseRecipeAudio(
      new Blob([''], { type: 'video/mp4' }),
      'tr',
    )
    expect(result.transcription.truncated).toBe(true)
    expect(result.transcription.source).toBe('video')
    expect(result.transcription.languageProbability).toBe(0.95)
  })

  it('treats an empty/unknown source field as "audio"', async () => {
    server.use(
      http.post(`${BASE}/parse/recipe-audio`, () =>
        HttpResponse.json({
          success: true,
          data: {
            transcription: {
              text: 'foo',
              languageCode: 'tr',
              languageProbability: 0.8,
              truncated: false,
              // source missing
            },
            recipe: { title: '', ingredients: [], steps: [], tools: [] },
          },
          error: null,
        }),
      ),
    )

    const result = await parseService.parseRecipeAudio(
      new Blob([''], { type: 'audio/webm' }),
    )
    expect(result.transcription.source).toBe('audio')
  })
})
