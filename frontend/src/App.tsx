import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap'

function AppWithBootstrap() {
  useAuthBootstrap()
  return <RouterProvider router={router} />
}

export default function App() {
  return <AppWithBootstrap />
}
