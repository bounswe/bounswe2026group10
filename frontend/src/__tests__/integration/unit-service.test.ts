import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { unitService } from '@/services/unit-service'

const BASE = 'http://localhost/api'

describe('unitService.search()', () => {
  it('omits the search param when input is empty/whitespace', async () => {
    let capturedUrl: URL | null = null
    server.use(
      http.get(`${BASE}/units`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await unitService.search()
    expect(capturedUrl!.searchParams.has('search')).toBe(false)

    await unitService.search('   ')
    expect(capturedUrl!.searchParams.has('search')).toBe(false)
  })

  it('trims and sends the search query', async () => {
    let capturedUrl: URL | null = null
    server.use(
      http.get(`${BASE}/units`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await unitService.search('  cup  ')
    expect(capturedUrl!.searchParams.get('search')).toBe('cup')
  })

  it('maps {unit} rows to trimmed strings and drops blanks', async () => {
    server.use(
      http.get(`${BASE}/units`, () =>
        HttpResponse.json({
          success: true,
          data: [
            { unit: 'tbsp' },
            { unit: '  cup ' },
            { unit: '' },
            { unit: '   ' },
          ],
          error: null,
        }),
      ),
    )

    const units = await unitService.search()
    expect(units).toEqual(['tbsp', 'cup'])
  })

  it('returns empty array when API data is not an array', async () => {
    server.use(
      http.get(`${BASE}/units`, () =>
        HttpResponse.json({ success: true, data: null, error: null }),
      ),
    )

    const units = await unitService.search()
    expect(units).toEqual([])
  })
})
