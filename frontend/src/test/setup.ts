import '@testing-library/jest-dom'
import { server } from './mocks/server'

// ── Seed localStorage so session/auth-slice sees an authenticated user ──────
localStorage.setItem('rr_access_token', 'fake-test-token')
localStorage.setItem('rr_refresh_token', 'fake-refresh-token')
localStorage.setItem('rr_user_id', '1')

// ── Initialize i18n (uses localStorage for language, defaults to 'en') ──────
import '@/i18n/i18n'

// ── MSW lifecycle ───────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── Stub window.matchMedia (JSDOM does not implement it) ────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
