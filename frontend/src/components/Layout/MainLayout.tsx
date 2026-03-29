import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { useLogout } from '@/hooks/useLogout'
import { selectProfile } from '@/store/slices/profile-slice'
import { HeaderUser } from '@/components/Layout/HeaderUser'
import './MainLayout.css'

export function MainLayout() {
  const { t } = useTranslation('common')
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const profile = useAppSelector(selectProfile)
  const { logout, isLoggingOut } = useLogout()

  const profileLoading =
    profile.status === 'idle' || profile.status === 'loading'
  const roleLabel = profile.role ? t(`app.roles.${profile.role}`) : ''

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <span>Roots & Recipes</span>
          {isAuthenticated && (
            <div className="app-header__trailing">
              <HeaderUser
                username={profile.username}
                role={profile.role}
                loading={profileLoading}
                failed={profile.status === 'failed'}
                errorMessage={profile.error}
                roleLabel={roleLabel}
              />
              <button
                type="button"
                className="app-header__logout"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
                aria-label={t('app.logout')}
              >
                {isLoggingOut ? <span className="ui-spinner" aria-hidden /> : t('app.logout')}
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
