import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { discoveryService } from '@/services/discovery-service'

const BASE = 'http://localhost/api'

describe('discoveryService allergen normalization', () => {
  it('normalizes allergens array on recipe summaries from discovery', async () => {
    server.use(
      http.get(`${BASE}/discovery/recipes`, () =>
        HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: 1,
                title: 'Test Recipe',
                type: 'community',
                profile: { username: 'chef1' },
                dish_variety: null,
                allergens: [
                  { id: 1, name: 'Gluten' },
                  { id: 2, name: 'Dairy' },
                ],
              },
            ],
            pagination: { page: 1, limit: 20, total: 1 },
          },
          error: null,
        }),
      ),
    )

    const result = await discoveryService.getRecipeResults()

    expect(result.recipes[0].allergens).toHaveLength(2)
    expect(result.recipes[0].allergens![0]).toEqual({ id: 1, name: 'Gluten' })
    expect(result.recipes[0].allergens![1]).toEqual({ id: 2, name: 'Dairy' })
  })

  it('sets allergens to undefined when not present in response', async () => {
    server.use(
      http.get(`${BASE}/discovery/recipes`, () =>
        HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: 2,
                title: 'No Allergen Recipe',
                type: 'community',
                profile: { username: 'chef2' },
                dish_variety: null,
              },
            ],
            pagination: { page: 1, limit: 20, total: 1 },
          },
          error: null,
        }),
      ),
    )

    const result = await discoveryService.getRecipeResults()

    expect(result.recipes[0].allergens).toBeUndefined()
  })

  it('sends excludeAllergens param with numeric allergen IDs', async () => {
    let capturedParams: URLSearchParams | null = null

    server.use(
      http.get(`${BASE}/discovery/recipes`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json({
          success: true,
          data: { recipes: [], pagination: { page: 1, limit: 20, total: 0 } },
          error: null,
        })
      }),
    )

    await discoveryService.getRecipeResults({ excludeAllergens: '1,3' })

    expect(capturedParams!.get('excludeAllergens')).toBe('1,3')
  })
})
