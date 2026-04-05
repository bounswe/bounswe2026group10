import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { discoveryService } from '@/services/discovery-service'

describe('Discovery service API parameter verification', () => {
  it('getRecipes sends region, excludeAllergens, tagIds, and genreId as query params', async () => {
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/discovery/recipes', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({
          success: true,
          data: { recipes: [], pagination: { page: 1, limit: 20, total: 0 } },
          error: null,
        })
      }),
    )

    await discoveryService.getRecipes({
      region: 'Turkey',
      excludeAllergens: '3,4',
      tagIds: '1,2',
      genreId: '1',
    })

    expect(capturedParams).not.toBeNull()
    expect(capturedParams!.get('region')).toBe('Turkey')
    expect(capturedParams!.get('excludeAllergens')).toBe('3,4')
    expect(capturedParams!.get('tagIds')).toBe('1,2')
    expect(capturedParams!.get('genreId')).toBe('1')
  })

  it('getRecipeResults returns normalized pagination', async () => {
    server.use(
      http.get('/api/discovery/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: 1,
                title: 'Test Recipe',
                type: 'community',
                profile: { username: 'test' },
                dish_variety: { id: 1, name: 'Test', region: 'Turkey', dish_genre: { id: 1, name: 'Soups' } },
              },
            ],
            pagination: { page: 2, limit: 10, total: 25 },
          },
          error: null,
        })
      }),
    )

    const result = await discoveryService.getRecipeResults({ page: 2, limit: 10 })

    expect(result.pagination.page).toBe(2)
    expect(result.pagination.limit).toBe(10)
    expect(result.pagination.total).toBe(25)
    expect(result.recipes).toHaveLength(1)
    expect(result.recipes[0].title).toBe('Test Recipe')
  })

  it('getVarieties passes genreId and search params', async () => {
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get('/api/dish-varieties', ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await discoveryService.getVarieties({ genreId: '1', search: 'lentil' })

    expect(capturedParams).not.toBeNull()
    expect(capturedParams!.get('genreId')).toBe('1')
    expect(capturedParams!.get('search')).toBe('lentil')
  })

  it('getVarieties omits empty params', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/api/dish-varieties', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await discoveryService.getVarieties()

    expect(capturedUrl).not.toBeNull()
    // No query string when no params provided
    const url = new URL(capturedUrl!)
    expect(url.searchParams.has('genreId')).toBe(false)
    expect(url.searchParams.has('search')).toBe(false)
  })

  it('getDietaryTags returns normalized tags with correct categories', async () => {
    server.use(
      http.get('/api/dietary-tags', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: 1, name: 'Vegan', category: 'dietary' },
            { id: 2, name: 'Dairy', category: 'allergen' },
            { id: 3, name: 'Unknown', category: 'something_else' },
          ],
          error: null,
        })
      }),
    )

    const tags = await discoveryService.getDietaryTags()

    expect(tags).toHaveLength(3)
    expect(tags[0]).toEqual({ id: '1', name: 'Vegan', category: 'dietary' })
    expect(tags[1]).toEqual({ id: '2', name: 'Dairy', category: 'allergen' })
    // Non-allergen defaults to 'dietary'
    expect(tags[2]).toEqual({ id: '3', name: 'Unknown', category: 'dietary' })
  })

  it('getRegions returns an array of region strings', async () => {
    const regions = await discoveryService.getRegions()

    expect(regions).toEqual(['Turkey', 'Lebanon', 'Greece', 'Italy'])
  })
})
