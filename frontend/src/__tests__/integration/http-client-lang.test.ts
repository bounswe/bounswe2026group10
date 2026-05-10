import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { httpClient } from '@/lib/http-client'
import { LANGUAGE_STORAGE_KEY } from '@/lib/language-storage'

// In tests VITE_API_BASE_URL=/api (set in vite.config.ts test.env).
// jsdom sets window.location to http://localhost, so Axios resolves
// relative baseURL requests to http://localhost/api/<path>.
const BASE = 'http://localhost/api'

function interceptPath(path: string): Promise<URLSearchParams> {
  return new Promise((resolve) => {
    server.use(
      http.get(`${BASE}${path}`, ({ request }) => {
        resolve(new URL(request.url).searchParams)
        return HttpResponse.json({ success: true, data: null, error: null })
      }),
    )
  })
}

describe('httpClient lang interceptor', () => {
  afterEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  })

  it('sends lang=en when localStorage has "en"', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    const paramsPromise = interceptPath('/dish-genres')
    await httpClient.get('/dish-genres')
    const params = await paramsPromise
    expect(params.get('lang')).toBe('en')
  })

  it('sends lang=tr when localStorage has "tr"', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'tr')
    const paramsPromise = interceptPath('/dish-genres')
    await httpClient.get('/dish-genres')
    const params = await paramsPromise
    expect(params.get('lang')).toBe('tr')
  })

  it('defaults to lang=en when localStorage is empty', async () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    const paramsPromise = interceptPath('/dish-genres')
    await httpClient.get('/dish-genres')
    const params = await paramsPromise
    expect(params.get('lang')).toBe('en')
  })

  it('does not override an explicitly passed lang param', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    const paramsPromise = interceptPath('/dish-genres')
    await httpClient.get('/dish-genres', { params: { lang: 'tr' } })
    const params = await paramsPromise
    // caller-supplied lang wins (spread order: { lang: stored, ...config.params })
    expect(params.get('lang')).toBe('tr')
  })

  it('sends lang alongside other query params', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'tr')
    const paramsPromise = interceptPath('/dish-genres')
    await httpClient.get('/dish-genres', { params: { page: 1, limit: 20 } })
    const params = await paramsPromise
    expect(params.get('lang')).toBe('tr')
    expect(params.get('page')).toBe('1')
    expect(params.get('limit')).toBe('20')
  })
})
