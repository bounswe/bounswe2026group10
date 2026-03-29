import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { useLogout } from '@/hooks/useLogout'
import './MainLayout.css'

export function MainLayout() {
  const { t } = useTranslation('common')
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const { logout, isLoggingOut } = useLogout()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <span>Roots & Recipes</span>
          {isAuthenticated && (
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
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
