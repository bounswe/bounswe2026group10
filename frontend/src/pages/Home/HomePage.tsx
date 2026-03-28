import { useTranslation } from 'react-i18next'

export function HomePage() {
  const { t } = useTranslation('common')
  return (
    <section>
      <h1>{t('app.title')}</h1>
    </section>
  )
}
