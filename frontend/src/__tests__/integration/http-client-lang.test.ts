import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { httpClient } from '@/lib/http-client'
import { LANGUAGE_STORAGE_KEY } from '@/lib/language-storage'

describe('httpClient lang interceptor', () => {
  afterEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  })

  it('sends lang=en when localStorage has "en"', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/test-endpoint', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: null, error: null })
      }),
    )

    await httpClient.get('/test-endpoint')

    expect(capturedParams).not.toBeNull()
    expect(capturedParams!.get('lang')).toBe('en')
  })

  it('sends lang=tr when localStorage has "tr"', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'tr')
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/test-endpoint', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: null, error: null })
      }),
    )

    await httpClient.get('/test-endpoint')

    expect(capturedParams).not.toBeNull()
    expect(capturedParams!.get('lang')).toBe('tr')
  })

  it('defaults to lang=en when localStorage is empty', async () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/test-endpoint', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: null, error: null })
      }),
    )

    await httpClient.get('/test-endpoint')

    expect(capturedParams!.get('lang')).toBe('en')
  })

  it('does not override an explicitly passed lang param', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/test-endpoint', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: null, error: null })
      }),
    )

    await httpClient.get('/test-endpoint', { params: { lang: 'tr' } })

    // caller-supplied lang wins (spread order: { lang: stored, ...config.params })
    expect(capturedParams!.get('lang')).toBe('tr')
  })

  it('sends lang alongside other query params', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'tr')
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/dish-genres', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await httpClient.get('/dish-genres', { params: { page: 1, limit: 20 } })

    expect(capturedParams!.get('lang')).toBe('tr')
    expect(capturedParams!.get('page')).toBe('1')
    expect(capturedParams!.get('limit')).toBe('20')
  })
})
