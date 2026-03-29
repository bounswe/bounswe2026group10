import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutAsync } from '@/store/slices/auth-slice'
import './HomePage.css'

export function HomePage() {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  async function handleLogout() {
    await dispatch(logoutAsync()).unwrap()
    navigate('/', { replace: true })
  }

  return (
    <section className="home-page">
      <div className="home-page__header">
        <h1>{t('app.title')}</h1>
        {isAuthenticated && (
          <button type="button" className="home-page__logout" onClick={handleLogout}>
            {t('app.logout')}
          </button>
        )}
      </div>
    </section>
  )
}
