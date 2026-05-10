import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { recipeService } from '@/services/recipe-service'

const BASE = 'http://localhost/api'

describe('recipeService drafts', () => {
  describe('listDrafts()', () => {
    it('calls GET /users/me/drafts and normalizes response', async () => {
      let requestUrl: string | null = null

      server.use(
        http.get(`${BASE}/users/me/drafts`, ({ request }) => {
          requestUrl = request.url
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'draft-1',
                title: 'Untitled Stew',
                type: 'community',
                isPublished: false,
                averageRating: null,
                ratingCount: 0,
                country: 'Turkey',
                city: 'Istanbul',
                district: null,
                createdAt: '2026-05-09T12:00:00Z',
                updatedAt: '2026-05-09T12:00:00Z',
                coverImageUrl: null,
              },
              {
                id: 'draft-2',
                title: 'Cultural Sweet',
                type: 'cultural',
                isPublished: false,
                averageRating: null,
                ratingCount: 0,
                country: null,
                city: null,
                district: null,
                createdAt: '2026-05-08T10:00:00Z',
                updatedAt: '2026-05-08T10:00:00Z',
                coverImageUrl: 'https://example.com/img.jpg',
              },
            ],
            error: null,
          })
        }),
      )

      const drafts = await recipeService.listDrafts()

      expect(requestUrl).toContain('/users/me/drafts')
      expect(drafts).toHaveLength(2)
      expect(drafts[0]).toMatchObject({
        id: 'draft-1',
        title: 'Untitled Stew',
        type: 'community',
        isPublished: false,
        country: 'Turkey',
        city: 'Istanbul',
      })
      expect(drafts[1]).toMatchObject({
        id: 'draft-2',
        type: 'cultural',
        coverImageUrl: 'https://example.com/img.jpg',
      })
    })

    it('returns empty array when no drafts', async () => {
      server.use(
        http.get(`${BASE}/users/me/drafts`, () =>
          HttpResponse.json({ success: true, data: [], error: null }),
        ),
      )

      const drafts = await recipeService.listDrafts()
      expect(drafts).toEqual([])
    })

    it('coerces numeric ids to strings and falls back to defaults', async () => {
      server.use(
        http.get(`${BASE}/users/me/drafts`, () =>
          HttpResponse.json({
            success: true,
            data: [{ id: 42, title: null, type: 'unknown' }],
            error: null,
          }),
        ),
      )

      const drafts = await recipeService.listDrafts()
      expect(drafts[0].id).toBe('42')
      expect(drafts[0].title).toBe('')
      // unknown type falls back to community
      expect(drafts[0].type).toBe('community')
    })
  })

  describe('publish()', () => {
    it('calls POST /recipes/:id/publish', async () => {
      let requestUrl: string | null = null
      let method: string | null = null

      server.use(
        http.post(`${BASE}/recipes/draft-1/publish`, ({ request }) => {
          requestUrl = request.url
          method = request.method
          return HttpResponse.json({ success: true, data: null, error: null })
        }),
      )

      await recipeService.publish('draft-1')

      expect(method).toBe('POST')
      expect(requestUrl).toContain('/recipes/draft-1/publish')
    })
  })

  describe('delete()', () => {
    it('calls DELETE /recipes/:id', async () => {
      let method: string | null = null

      server.use(
        http.delete(`${BASE}/recipes/draft-1`, ({ request }) => {
          method = request.method
          return HttpResponse.json({ success: true, data: null, error: null })
        }),
      )

      await recipeService.delete('draft-1')
      expect(method).toBe('DELETE')
    })
  })
})
