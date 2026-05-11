import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { toolService } from '@/services/tool-service'

const BASE = 'http://localhost/api'

describe('toolService.search()', () => {
  it('omits the search param when input is empty', async () => {
    let capturedUrl: URL | null = null
    server.use(
      http.get(`${BASE}/tools`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await toolService.search()
    expect(capturedUrl!.searchParams.has('search')).toBe(false)

    await toolService.search('   ')
    expect(capturedUrl!.searchParams.has('search')).toBe(false)
  })

  it('trims and forwards the search query', async () => {
    let capturedUrl: URL | null = null
    server.use(
      http.get(`${BASE}/tools`, ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({ success: true, data: [], error: null })
      }),
    )

    await toolService.search('  whisk  ')
    expect(capturedUrl!.searchParams.get('search')).toBe('whisk')
  })

  it('returns trimmed tool names and filters out blank entries', async () => {
    server.use(
      http.get(`${BASE}/tools`, () =>
        HttpResponse.json({
          success: true,
          data: [
            { name: 'Whisk' },
            { name: '  Pan ' },
            { name: '' },
            { name: '   ' },
          ],
          error: null,
        }),
      ),
    )

    const tools = await toolService.search()
    expect(tools).toEqual([{ name: 'Whisk' }, { name: 'Pan' }])
  })

  it('returns empty array when API data is not an array', async () => {
    server.use(
      http.get(`${BASE}/tools`, () =>
        HttpResponse.json({ success: true, data: null, error: null }),
      ),
    )

    const tools = await toolService.search()
    expect(tools).toEqual([])
  })
})
