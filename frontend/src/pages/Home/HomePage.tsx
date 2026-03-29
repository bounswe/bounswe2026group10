import { useTranslation } from 'react-i18next'
import './HomePage.css'

export function HomePage() {
  const { t } = useTranslation('common')

  return (
    <section className="home-page">
      <div className="home-page__header">
        <h1>{t('app.title')}</h1>
      </div>
    </section>
  )
}
