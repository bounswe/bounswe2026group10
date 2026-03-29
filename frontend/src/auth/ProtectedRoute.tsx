/**
 * Optional `roles` restricts access by `profile.role` after profile has loaded.
 * Not wired in `router/index.tsx` for `/home` — guest flow must stay public until product decides otherwise.
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import type { UserRole } from '@/services/types/auth'
import './ProtectedRoute.css'

type ProtectedRouteProps = {
  children: ReactNode
  /** If set, user must have one of these roles (requires profile fetch succeeded). */
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const profileStatus = useAppSelector((s) => s.profile.status)
  const userRole = useAppSelector((s) => s.profile.role)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0) {
    if (profileStatus === 'loading' || profileStatus === 'idle') {
      return (
        <div className="protected-route__loading" aria-busy="true" aria-label="Loading">
          <span className="ui-spinner" aria-hidden />
        </div>
      )
    }
    if (profileStatus === 'failed' || !userRole || !roles.includes(userRole)) {
      return <Navigate to="/home" replace />
    }
  }

  return children
}
