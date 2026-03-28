import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/Layout/MainLayout'
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

  // ── Signed-in shell (pathless: no `path` here, so no conflict with '/') ─
  // MainLayout renders <Outlet />; children use their full absolute paths.
  {
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/home', element: <HomePage /> },
      // { path: '/library', element: <LibraryPage /> }
    ],
  },
  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])
