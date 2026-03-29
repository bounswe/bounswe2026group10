import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/Layout/MainLayout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { HomePage } from '@/pages/Home/HomePage'
import { LoginPage } from '@/pages/Login/LoginPage'
import { RegisterPage } from '@/pages/Register/RegisterPage'
import { WelcomePage } from '@/pages/Welcome/WelcomePage'
import { RouteError } from '@/router/RouteError'

export const router = createBrowserRouter([
  // ── Public / auth screens (no primary nav) ──────────────────────────────
  { path: '/', element: <WelcomePage />, errorElement: <RouteError /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  { path: '/register', element: <RegisterPage />, errorElement: <RouteError /> },

  // ── Signed-in shell — requires authentication ────────────────────────────
  // ProtectedRoute (no roles) gates the entire shell; unauthenticated users
  // are redirected to /login. Role-gated routes wrap their own element with
  // <ProtectedRoute roles={[…]} /> when the page is built.
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { path: '/home', element: <HomePage /> },
      // cook + expert only — uncomment when CreateRecipePage is built:
      // {
      //   path: '/create-recipe',
      //   element: (
      //     <ProtectedRoute roles={['cook', 'expert']}>
      //       <CreateRecipePage />
      //     </ProtectedRoute>
      //   ),
      // },
    ],
  },
  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])
