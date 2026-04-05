import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import authReducer from '@/store/slices/auth-slice'
import profileReducer from '@/store/slices/profile-slice'
import type { RootState } from '@/store/store'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { MainLayout } from '@/components/Layout/MainLayout'
import { DiscoveryPage } from '@/pages/Discovery/DiscoveryPage'
import { DishVarietyPage } from '@/pages/DishVariety/DishVarietyPage'
import { RecipeDetailPage } from '@/pages/RecipeDetail/RecipeDetailPage'

// ── Default preloaded state (authenticated learner) ─────────────────────────

const defaultPreloadedState: RootState = {
  auth: {
    isAuthenticated: true,
    loading: false,
    isLoggingOut: false,
    error: null,
  },
  profile: {
    userId: '1',
    username: 'testuser',
    email: 'test@test.com',
    role: 'learner',
    status: 'succeeded',
    error: null,
  },
}

// ── Default routes (mirrors the real router structure) ──────────────────────

const defaultRoutes: RouteObject[] = [
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/discovery', element: <DiscoveryPage /> },
      { path: '/dish-variety/:id', element: <DishVarietyPage /> },
      { path: '/recipes/:id', element: <RecipeDetailPage /> },
    ],
  },
]

// ── Options ─────────────────────────────────────────────────────────────────

interface RenderOptions {
  preloadedState?: Partial<RootState>
  initialEntries?: string[]
  routes?: RouteObject[]
}

/**
 * Render helper for integration tests.
 *
 * Provides Redux store (pre-authed), memory router, and i18n (global from setup.ts).
 * Returns a `user` instance from @testing-library/user-event for interactions.
 */
export function renderWithProviders(
  ui?: ReactElement,
  options: RenderOptions = {},
) {
  const {
    preloadedState = {},
    initialEntries = ['/discovery'],
    routes = defaultRoutes,
  } = options

  const mergedState = {
    ...defaultPreloadedState,
    ...preloadedState,
    auth: { ...defaultPreloadedState.auth, ...(preloadedState.auth ?? {}) },
    profile: { ...defaultPreloadedState.profile, ...(preloadedState.profile ?? {}) },
  } as RootState

  const store = configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
    },
    preloadedState: mergedState,
  })

  const router = createMemoryRouter(routes, { initialEntries })

  const user = userEvent.setup()

  const rendered = render(
    <Provider store={store}>
      {ui ?? <RouterProvider router={router} />}
    </Provider>,
  )

  return { ...rendered, store, user, router }
}
