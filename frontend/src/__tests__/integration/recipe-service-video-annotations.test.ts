import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { recipeService } from '@/services/recipe-service'

const BASE = 'http://localhost/api'

describe('recipeService.getById — videoAnnotations normalization', () => {
  it('normalizes camelCase videoAnnotations from GET /recipes/:id', async () => {
    server.use(
      http.get(`${BASE}/recipes/r1`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: 'r1',
            title: 'Test Recipe',
            videoAnnotations: [
              {
                id: 1,
                recipeId: 'r1',
                startTime: 12.5,
                endTime: 18.75,
                note: 'Searing the meat',
                technique: 'Searing',
                createdAt: '2026-05-09T10:00:00Z',
              },
              {
                id: 2,
                recipeId: 'r1',
                startTime: 60,
                endTime: 90,
                note: 'Stirring continuously',
                technique: null,
                createdAt: '2026-05-09T10:01:00Z',
              },
            ],
          },
          error: null,
        }),
      ),
    )

    const recipe = await recipeService.getById('r1')

    expect(recipe.videoAnnotations).toHaveLength(2)
    expect(recipe.videoAnnotations[0]).toMatchObject({
      id: '1',
      recipeId: 'r1',
      startTime: 12.5,
      endTime: 18.75,
      note: 'Searing the meat',
      technique: 'Searing',
    })
    expect(recipe.videoAnnotations[1].technique).toBeNull()
  })

  it('returns empty array when videoAnnotations is missing', async () => {
    server.use(
      http.get(`${BASE}/recipes/r2`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 'r2', title: 'No Annotations' },
          error: null,
        }),
      ),
    )

    const recipe = await recipeService.getById('r2')
    expect(recipe.videoAnnotations).toEqual([])
  })

  it('also accepts snake_case fields (defensive)', async () => {
    server.use(
      http.get(`${BASE}/recipes/r3`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: 'r3',
            title: 'Snake Case',
            videoAnnotations: [
              {
                id: 9,
                recipe_id: 'r3',
                start_time: '5',
                end_time: '10',
                note: 'Test',
                created_at: '2026-05-09T11:00:00Z',
              },
            ],
          },
          error: null,
        }),
      ),
    )

    const recipe = await recipeService.getById('r3')
    expect(recipe.videoAnnotations[0]).toMatchObject({
      id: '9',
      recipeId: 'r3',
      startTime: 5,
      endTime: 10,
      note: 'Test',
    })
  })
})
