import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { expertRequestService } from '@/services/expert-request-service'

const BASE = 'http://localhost/api'

describe('expertRequestService', () => {
  describe('submit()', () => {
    it('POSTs the reason and returns the created request', async () => {
      let capturedBody: unknown = null
      server.use(
        http.post(`${BASE}/auth/expert-requests`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              id: 'er-1',
              userId: 'u-1',
              reason: 'I have a culinary degree',
              status: 'pending',
              decisionNote: null,
              decidedBy: null,
              createdAt: '2026-05-01T00:00:00Z',
              decidedAt: null,
            },
            error: null,
          })
        }),
      )

      const result = await expertRequestService.submit('I have a culinary degree')
      expect(capturedBody).toEqual({ reason: 'I have a culinary degree' })
      expect(result.id).toBe('er-1')
      expect(result.status).toBe('pending')
    })

    it('rejects when backend returns 409 EXPERT_REQUEST_PENDING', async () => {
      server.use(
        http.post(`${BASE}/auth/expert-requests`, () =>
          HttpResponse.json(
            {
              success: false,
              data: null,
              error: { code: 'EXPERT_REQUEST_PENDING', message: 'already pending' },
            },
            { status: 409 },
          ),
        ),
      )

      await expect(expertRequestService.submit('again')).rejects.toBeDefined()
    })
  })

  describe('getMine()', () => {
    it('returns null when no request exists', async () => {
      server.use(
        http.get(`${BASE}/auth/expert-requests/me`, () =>
          HttpResponse.json({ success: true, data: null, error: null }),
        ),
      )

      const result = await expertRequestService.getMine()
      expect(result).toBeNull()
    })

    it('returns the latest expert request when present', async () => {
      server.use(
        http.get(`${BASE}/auth/expert-requests/me`, () =>
          HttpResponse.json({
            success: true,
            data: {
              id: 'er-9',
              userId: 'u-1',
              reason: 'experienced',
              status: 'approved',
              decisionNote: 'welcome',
              decidedBy: 'admin-1',
              createdAt: '2026-04-01T00:00:00Z',
              decidedAt: '2026-04-02T00:00:00Z',
            },
            error: null,
          }),
        ),
      )

      const result = await expertRequestService.getMine()
      expect(result?.id).toBe('er-9')
      expect(result?.status).toBe('approved')
    })
  })
})
