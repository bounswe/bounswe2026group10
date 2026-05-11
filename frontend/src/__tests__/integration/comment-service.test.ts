import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { commentService } from '@/services/comment-service'

const BASE = 'http://localhost/api'

describe('commentService', () => {
  describe('list()', () => {
    it('forwards pagination and returns comments page', async () => {
      let capturedUrl: URL | null = null
      server.use(
        http.get(`${BASE}/recipes/:id/comments`, ({ request }) => {
          capturedUrl = new URL(request.url)
          return HttpResponse.json({
            success: true,
            data: {
              comments: [
                {
                  id: 'c1',
                  recipeId: '10',
                  userId: 'u1',
                  username: 'alice',
                  body: 'Great recipe!',
                  score: 5,
                  createdAt: '2026-05-01T00:00:00Z',
                  updatedAt: '2026-05-01T00:00:00Z',
                },
              ],
              pagination: { page: 3, limit: 2, total: 1 },
            },
            error: null,
          })
        }),
      )

      const page = await commentService.list('10', 3, 2)

      expect(capturedUrl!.searchParams.get('page')).toBe('3')
      expect(capturedUrl!.searchParams.get('limit')).toBe('2')
      expect(page.comments).toHaveLength(1)
      expect(page.comments[0].username).toBe('alice')
    })
  })

  describe('create()', () => {
    it('omits score when not provided and flattens response', async () => {
      let capturedBody: Record<string, unknown> | null = null
      server.use(
        http.post(`${BASE}/recipes/:id/comments`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({
            success: true,
            data: {
              comment: {
                id: 'c2',
                recipeId: '10',
                userId: 'u1',
                username: 'alice',
                body: 'Yum',
                createdAt: '2026-05-02T00:00:00Z',
                updatedAt: '2026-05-02T00:00:00Z',
              },
              rating: null,
            },
            error: null,
          })
        }),
      )

      const comment = await commentService.create('10', 'Yum')

      expect(capturedBody).toEqual({ body: 'Yum' })
      expect(capturedBody && 'score' in capturedBody).toBe(false)
      expect(comment.score).toBeNull()
      expect(comment.body).toBe('Yum')
    })

    it('includes score and merges rating.score onto the returned comment', async () => {
      let capturedBody: unknown = null
      server.use(
        http.post(`${BASE}/recipes/:id/comments`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              comment: {
                id: 'c3',
                recipeId: '10',
                userId: 'u1',
                username: 'alice',
                body: 'Loved it',
                createdAt: '2026-05-02T00:00:00Z',
                updatedAt: '2026-05-02T00:00:00Z',
              },
              rating: { score: 4 },
            },
            error: null,
          })
        }),
      )

      const comment = await commentService.create('10', 'Loved it', 4)

      expect(capturedBody).toEqual({ body: 'Loved it', score: 4 })
      expect(comment.score).toBe(4)
    })
  })

  describe('remove()', () => {
    it('DELETEs /comments/:id', async () => {
      let captured: string | undefined
      server.use(
        http.delete(`${BASE}/comments/:id`, ({ params }) => {
          captured = params.id as string
          return new HttpResponse(null, { status: 204 })
        }),
      )

      await commentService.remove('c9')
      expect(captured).toBe('c9')
    })
  })

  describe('edit()', () => {
    it('PATCHes /comments/:id with body and returns updated comment', async () => {
      let capturedBody: unknown = null
      server.use(
        http.patch(`${BASE}/comments/:id`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 'c4',
              recipeId: '10',
              userId: 'u1',
              username: 'alice',
              body: 'edited',
              score: null,
              createdAt: '2026-05-02T00:00:00Z',
              updatedAt: '2026-05-03T00:00:00Z',
            },
            error: null,
          })
        }),
      )

      const updated = await commentService.edit('c4', 'edited')
      expect(capturedBody).toEqual({ body: 'edited' })
      expect(updated.body).toBe('edited')
    })
  })
})
