import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/components/Layout/MainLayout'
import { HomePage } from '@/pages/Home/HomePage'
import { LoginPage } from '@/pages/Login/LoginPage'
import { RegisterPage } from '@/pages/Register/RegisterPage'
import { WelcomePage } from '@/pages/Welcome/WelcomePage'
import { RouteError } from '@/router/RouteError'

export const router = createBrowserRouter([
  { path: '/', element: <WelcomePage />, errorElement: <RouteError /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'home', element: <HomePage /> },
    ],
  },
])
