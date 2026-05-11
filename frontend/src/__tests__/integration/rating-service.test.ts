import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { ratingService } from '@/services/rating-service'

const BASE = 'http://localhost/api'

describe('ratingService', () => {
  describe('submitRating()', () => {
    it('posts score and normalizes snake_case → camelCase', async () => {
      let capturedBody: unknown = null
      server.use(
        http.post(`${BASE}/recipes/:id/ratings`, async ({ request, params }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 11,
              recipe_id: String(params.id),
              user_id: 'user-1',
              score: 5,
              created_at: '2026-05-01T00:00:00Z',
              updated_at: '2026-05-02T00:00:00Z',
            },
            error: null,
          })
        }),
      )

      const result = await ratingService.submitRating('100', 5)

      expect(capturedBody).toEqual({ score: 5 })
      expect(result).toEqual({
        id: '11',
        recipeId: '100',
        userId: 'user-1',
        score: 5,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      })
    })
  })

  describe('getMyRating()', () => {
    it('returns null when backend sends data:null', async () => {
      server.use(
        http.get(`${BASE}/recipes/:id/ratings/me`, () =>
          HttpResponse.json({ success: true, data: null, error: null }),
        ),
      )

      const result = await ratingService.getMyRating('200')
      expect(result).toBeNull()
    })

    it('normalizes the existing rating row', async () => {
      server.use(
        http.get(`${BASE}/recipes/:id/ratings/me`, () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 3,
              score: 4,
              created_at: '2026-05-01T00:00:00Z',
              updated_at: '2026-05-03T00:00:00Z',
            },
            error: null,
          }),
        ),
      )

      const result = await ratingService.getMyRating('200')
      expect(result).toEqual({
        id: '3',
        score: 4,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-03T00:00:00Z',
      })
    })
  })

  describe('deleteMyRating()', () => {
    it('DELETEs /recipes/:id/ratings/me', async () => {
      let calledForId: string | undefined
      server.use(
        http.delete(`${BASE}/recipes/:id/ratings/me`, ({ params }) => {
          calledForId = params.id as string
          return new HttpResponse(null, { status: 204 })
        }),
      )

      await ratingService.deleteMyRating('300')
      expect(calledForId).toBe('300')
    })
  })
})
