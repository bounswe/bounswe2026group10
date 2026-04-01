import { useTranslation } from 'react-i18next'
import './LibraryPage.css'

export function LibraryPage() {
  const { t } = useTranslation('common')

  return (
    <div className="library-page">
      <h1 className="library-page__title">{t('library.title')}</h1>
      <p className="library-page__placeholder">{t('library.placeholder')}</p>
    </div>
  )
}
