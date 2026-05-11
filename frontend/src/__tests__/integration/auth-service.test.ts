import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { authService } from '@/services/auth-service'

const BASE = 'http://localhost/api'

describe('authService', () => {
  describe('login()', () => {
    it('sends credentials and returns the unwrapped data payload', async () => {
      let capturedBody: unknown = null

      server.use(
        http.post(`${BASE}/auth/login`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              userId: '42',
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            },
          })
        }),
      )

      const result = await authService.login({
        email: 'user@example.com',
        password: 'secret',
      })

      expect(capturedBody).toEqual({ email: 'user@example.com', password: 'secret' })
      expect(result).toEqual({
        userId: '42',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })

    it('rejects when the server returns 401', async () => {
      server.use(
        http.post(`${BASE}/auth/login`, () =>
          HttpResponse.json(
            { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'bad' } },
            { status: 401 },
          ),
        ),
      )

      await expect(
        authService.login({ email: 'u@example.com', password: 'wrong' }),
      ).rejects.toBeDefined()
    })
  })

  describe('register()', () => {
    it('forwards the registration payload and returns tokens', async () => {
      let capturedBody: unknown = null

      server.use(
        http.post(`${BASE}/auth/register`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            success: true,
            data: {
              userId: '7',
              accessToken: 'a',
              refreshToken: 'r',
              role: 'cook',
            },
          })
        }),
      )

      const result = await authService.register({
        email: 'new@example.com',
        password: 'pw1234567',
        username: 'newbie',
        role: 'cook',
      })

      expect(capturedBody).toEqual({
        email: 'new@example.com',
        password: 'pw1234567',
        username: 'newbie',
        role: 'cook',
      })
      expect(result.userId).toBe('7')
      expect(result.role).toBe('cook')
    })

    it('passes through pendingExpertRequest when registering as expert', async () => {
      server.use(
        http.post(`${BASE}/auth/register`, () =>
          HttpResponse.json({
            success: true,
            data: {
              userId: '9',
              accessToken: 'a',
              refreshToken: 'r',
              role: 'cook',
              pendingExpertRequest: true,
            },
          }),
        ),
      )

      const result = await authService.register({
        email: 'expert@example.com',
        password: 'pw1234567',
        username: 'expert',
        role: 'expert',
        expertRequestReason: 'I cook traditional food',
      })

      expect(result.pendingExpertRequest).toBe(true)
      expect(result.role).toBe('cook')
    })
  })

  describe('logout()', () => {
    it('POSTs to /auth/logout', async () => {
      let called = false
      server.use(
        http.post(`${BASE}/auth/logout`, () => {
          called = true
          return new HttpResponse(null, { status: 204 })
        }),
      )

      await authService.logout()
      expect(called).toBe(true)
    })
  })
})
