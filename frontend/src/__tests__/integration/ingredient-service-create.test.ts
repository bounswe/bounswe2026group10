import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { ingredientService } from '@/services/ingredient-service'

const BASE = 'http://localhost/api'

describe('ingredientService.create()', () => {
  it('sends name_en and name_tr (not name) to POST /ingredients', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post(`${BASE}/ingredients`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({
          success: true,
          data: { id: 42, name: 'Tahini' },
          error: null,
        })
      }),
    )

    await ingredientService.create('Tahini')

    expect(capturedBody).toEqual({ name_en: 'Tahini', name_tr: 'Tahini' })
    expect((capturedBody as any).name).toBeUndefined()
  })

  it('returns the created ingredient with id and name', async () => {
    server.use(
      http.post(`${BASE}/ingredients`, () =>
        HttpResponse.json({
          success: true,
          data: { id: 7, name: 'Sumac' },
          error: null,
        }),
      ),
    )

    const result = await ingredientService.create('Sumac')

    expect(result.id).toBe(7)
    expect(result.name).toBe('Sumac')
  })
})
