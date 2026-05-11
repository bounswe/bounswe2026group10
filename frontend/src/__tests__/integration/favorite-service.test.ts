import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { favoriteService } from '@/services/favorite-service'

const BASE = 'http://localhost/api'

describe('favoriteService', () => {
  describe('add()', () => {
    it('POSTs to /users/me/favorites/:id', async () => {
      let capturedId: string | undefined
      server.use(
        http.post(`${BASE}/users/me/favorites/:id`, ({ params }) => {
          capturedId = params.id as string
          return HttpResponse.json({
            success: true,
            data: { recipeId: params.id, favorited: true },
            error: null,
          })
        }),
      )

      await favoriteService.add('abc-123')
      expect(capturedId).toBe('abc-123')
    })
  })

  describe('remove()', () => {
    it('DELETEs /users/me/favorites/:id', async () => {
      let capturedId: string | undefined
      server.use(
        http.delete(`${BASE}/users/me/favorites/:id`, ({ params }) => {
          capturedId = params.id as string
          return new HttpResponse(null, { status: 204 })
        }),
      )

      await favoriteService.remove('xyz-9')
      expect(capturedId).toBe('xyz-9')
    })
  })

  describe('list()', () => {
    it('forwards page/limit and returns the favorites page', async () => {
      let capturedUrl: URL | null = null
      server.use(
        http.get(`${BASE}/users/me/favorites`, ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({
            success: true,
            data: {
              recipes: [
                {
                  id: 'r1',
                  title: 'Lahmacun',
                  type: 'cultural',
                  averageRating: 4.5,
                  ratingCount: 12,
                  creatorUsername: 'chef',
                  dishVarietyName: 'Lahmacun',
                  genreName: 'Pastries',
                  coverImageUrl: null,
                  createdAt: '2026-04-01T00:00:00Z',
                },
              ],
              pagination: { page: 2, limit: 5, total: 1 },
            },
            error: null,
          })
        }),
      )

      const result = await favoriteService.list(2, 5)

      expect(capturedUrl!.searchParams.get('page')).toBe('2')
      expect(capturedUrl!.searchParams.get('limit')).toBe('5')
      expect(result.recipes).toHaveLength(1)
      expect(result.recipes[0].title).toBe('Lahmacun')
      expect(result.pagination.total).toBe(1)
    })

    it('uses defaults page=1 limit=20 when no args given', async () => {
      let capturedUrl: URL | null = null
      server.use(
        http.get(`${BASE}/users/me/favorites`, ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({
            success: true,
            data: { recipes: [], pagination: { page: 1, limit: 20, total: 0 } },
            error: null,
          })
        }),
      )

      await favoriteService.list()
      expect(capturedUrl!.searchParams.get('page')).toBe('1')
      expect(capturedUrl!.searchParams.get('limit')).toBe('20')
    })
  })
})
