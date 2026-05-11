import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { profileService } from '@/services/profile-service'

const BASE = 'http://localhost/api'

describe('profileService.getCurrentUser()', () => {
  it('returns the unwrapped /auth/me payload', async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json({
          success: true,
          data: {
            userId: 'u-1',
            email: 'me@example.com',
            username: 'me',
            role: 'cook',
            createdAt: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      ),
    )

    const me = await profileService.getCurrentUser()

    expect(me).toEqual({
      userId: 'u-1',
      email: 'me@example.com',
      username: 'me',
      role: 'cook',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })

  it('rejects when /auth/me returns 401', async () => {
    server.use(
      http.get(`${BASE}/auth/me`, () =>
        HttpResponse.json(
          { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'no' } },
          { status: 401 },
        ),
      ),
    )

    await expect(profileService.getCurrentUser()).rejects.toBeDefined()
  })
})
