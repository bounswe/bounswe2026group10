import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { allergenService } from '@/services/allergen-service'

const BASE = 'http://localhost/api'

describe('allergenService', () => {
  describe('list()', () => {
    it('returns normalized allergens from GET /allergens', async () => {
      server.use(
        http.get(`${BASE}/allergens`, () =>
          HttpResponse.json({
            success: true,
            data: [
              { id: 1, name: 'Gluten' },
              { id: 2, name: 'Dairy' },
              { id: 3, name: 'Nuts' },
            ],
            error: null,
          }),
        ),
      )

      const result = await allergenService.list()

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: 1, name: 'Gluten' })
      expect(result[1]).toEqual({ id: 2, name: 'Dairy' })
      expect(result[2]).toEqual({ id: 3, name: 'Nuts' })
    })

    it('returns empty array when no allergens exist', async () => {
      server.use(
        http.get(`${BASE}/allergens`, () =>
          HttpResponse.json({ success: true, data: [], error: null }),
        ),
      )

      const result = await allergenService.list()
      expect(result).toEqual([])
    })
  })

  describe('detect()', () => {
    it('returns empty array without calling API when ingredientIds is empty', async () => {
      let called = false
      server.use(
        http.post(`${BASE}/allergens/detect`, () => {
          called = true
          return HttpResponse.json({ success: true, data: [], error: null })
        }),
      )

      const result = await allergenService.detect([])

      expect(called).toBe(false)
      expect(result).toEqual([])
    })

    it('sends ingredientIds and returns detected allergens', async () => {
      let capturedBody: unknown = null

      server.use(
        http.post(`${BASE}/allergens/detect`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: [{ id: 1, name: 'Gluten' }],
            error: null,
          })
        }),
      )

      const result = await allergenService.detect([10, 20, 30])

      expect(capturedBody).toEqual({ ingredientIds: [10, 20, 30] })
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ id: 1, name: 'Gluten' })
    })

    it('deduplicates allergens returned for multiple ingredients', async () => {
      server.use(
        http.post(`${BASE}/allergens/detect`, () =>
          HttpResponse.json({
            success: true,
            data: [
              { id: 1, name: 'Gluten' },
              { id: 2, name: 'Dairy' },
            ],
            error: null,
          }),
        ),
      )

      const result = await allergenService.detect([5, 6])
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no allergens found for given ingredients', async () => {
      server.use(
        http.post(`${BASE}/allergens/detect`, () =>
          HttpResponse.json({ success: true, data: [], error: null }),
        ),
      )

      const result = await allergenService.detect([99])
      expect(result).toEqual([])
    })
  })
})
