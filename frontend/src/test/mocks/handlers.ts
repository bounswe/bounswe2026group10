import { http, HttpResponse } from 'msw'
import {
  mockGenres,
  mockVarieties,
  mockVarietyDetail,
  mockRecipeDetail,
  mockDietaryTags,
  mockRegions,
  mockDiscoveryRecipes,
} from './data'

/** All paths prefixed with /api to match the httpClient baseURL from .env */
export const handlers = [
  http.get('/api/dish-genres', () => {
    return HttpResponse.json({ success: true, data: mockGenres, error: null })
  }),

  http.get('/api/dish-varieties', ({ request }) => {
    const url = new URL(request.url)
    const genreId = url.searchParams.get('genreId')
    const search = url.searchParams.get('search')

    let filtered = [...mockVarieties]
    if (genreId) {
      filtered = filtered.filter((v) => String(v.genre_id) === genreId)
    }
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.dish_genre.name.toLowerCase().includes(q) ||
          (v.region?.toLowerCase().includes(q) ?? false),
      )
    }

    return HttpResponse.json({ success: true, data: filtered, error: null })
  }),

  http.get('/api/dish-varieties/:id', ({ params }) => {
    const id = Number(params.id)
    if (id === mockVarietyDetail.id) {
      return HttpResponse.json({ success: true, data: mockVarietyDetail, error: null })
    }
    return HttpResponse.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Variety not found' } },
      { status: 404 },
    )
  }),

  http.get('/api/recipes/:id', ({ params }) => {
    const id = Number(params.id)
    if (id === mockRecipeDetail.id) {
      return HttpResponse.json({ success: true, data: mockRecipeDetail, error: null })
    }
    return HttpResponse.json(
      { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Recipe not found' } },
      { status: 404 },
    )
  }),

  http.get('/api/recipes/:id/ratings/me', () => {
    return HttpResponse.json({ success: true, data: null, error: null })
  }),

  http.get('/api/discovery/recipes', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 20)

    return HttpResponse.json({
      success: true,
      data: {
        recipes: mockDiscoveryRecipes,
        pagination: { page, limit, total: mockDiscoveryRecipes.length },
      },
      error: null,
    })
  }),

  http.get('/api/dietary-tags', () => {
    return HttpResponse.json({ success: true, data: mockDietaryTags, error: null })
  }),

  http.get('/api/meta/regions', () => {
    return HttpResponse.json({ success: true, data: mockRegions, error: null })
  }),
]
