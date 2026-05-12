import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { mediaService } from '@/services/media-service'

const BASE = 'http://localhost/api'

describe('mediaService', () => {
  describe('uploadFile()', () => {
    it('POSTs to /media/upload and normalizes the response payload', async () => {
      let called = false
      let capturedContentType: string | null = null

      server.use(
        http.post(`${BASE}/media/upload`, ({ request }) => {
          called = true
          capturedContentType = request.headers.get('content-type')
          return HttpResponse.json({
            success: true,
            data: { url: 'https://cdn.example/x.png', type: 'image', size: 123 },
            error: null,
          })
        }),
      )

      const file = new File([new Uint8Array([1, 2, 3, 4])], 'hello.png', {
        type: 'image/png',
      })

      const result = await mediaService.uploadFile(file)
      expect(called).toBe(true)
      expect(capturedContentType ?? '').toMatch(/multipart\/form-data/)
      expect(result).toEqual({
        url: 'https://cdn.example/x.png',
        type: 'image',
        size: 123,
      })
    })

    it('defaults type to "image" when backend returns unknown type', async () => {
      server.use(
        http.post(`${BASE}/media/upload`, () =>
          HttpResponse.json({
            success: true,
            data: { url: 'https://cdn.example/y', type: 'weird', size: 9 },
            error: null,
          }),
        ),
      )

      const result = await mediaService.uploadFile(new File(['x'], 'x.bin'))
      expect(result.type).toBe('image')
      expect(result.size).toBe(9)
    })

    it('preserves "video" type', async () => {
      server.use(
        http.post(`${BASE}/media/upload`, () =>
          HttpResponse.json({
            success: true,
            data: { url: 'https://cdn.example/v.mp4', type: 'video', size: 4242 },
            error: null,
          }),
        ),
      )

      const result = await mediaService.uploadFile(new File(['x'], 'v.mp4'))
      expect(result.type).toBe('video')
    })
  })

  describe('attachRecipeMedia()', () => {
    it('POSTs payload to /recipes/:id/media and normalizes created_at → createdAt', async () => {
      let capturedBody: unknown = null
      server.use(
        http.post(`${BASE}/recipes/:id/media`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 55,
              url: 'https://cdn.example/x.png',
              type: 'image',
              created_at: '2026-05-01T00:00:00Z',
            },
            error: null,
          })
        }),
      )

      const result = await mediaService.attachRecipeMedia('77', {
        url: 'https://cdn.example/x.png',
        type: 'image',
      })

      expect(capturedBody).toEqual({
        url: 'https://cdn.example/x.png',
        type: 'image',
      })
      expect(result).toEqual({
        id: '55',
        url: 'https://cdn.example/x.png',
        type: 'image',
        createdAt: '2026-05-01T00:00:00Z',
      })
    })
  })

  describe('deleteRecipeMedia()', () => {
    it('DELETEs /recipes/:id/media/:mediaId', async () => {
      let captured: { recipe?: string; media?: string } = {}
      server.use(
        http.delete(`${BASE}/recipes/:id/media/:mediaId`, ({ params }) => {
          captured = {
            recipe: params.id as string,
            media: params.mediaId as string,
          }
          return new HttpResponse(null, { status: 204 })
        }),
      )

      await mediaService.deleteRecipeMedia('77', 'media-9')
      expect(captured).toEqual({ recipe: '77', media: 'media-9' })
    })
  })
})
