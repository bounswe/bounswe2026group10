import type { UserRole } from '@/services/types/auth'
import './HeaderUser.css'

export interface HeaderUserProps {
  username: string | null
  role: UserRole | null
  loading: boolean
  failed: boolean
  errorMessage: string | null
  roleLabel: string
}

export function HeaderUser({
  username,
  role,
  loading,
  failed,
  errorMessage,
  roleLabel,
}: HeaderUserProps) {
  if (loading) {
    return (
      <div className="header-user" aria-live="polite">
        <span className="ui-spinner" aria-hidden />
        <span className="sr-only">Loading profile</span>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="header-user header-user--error" role="status">
        <span className="header-user__error">{errorMessage ?? 'Profile unavailable'}</span>
      </div>
    )
  }

  return (
    <div className="header-user">
      <span className="header-user__name">{username}</span>
      {role ? (
        <span className="header-user__role" title={role}>
          {roleLabel}
        </span>
      ) : null}
    </div>
  )
}
