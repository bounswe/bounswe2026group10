import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import i18n from '@/i18n/i18n'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/lib/language-storage'
import './LanguageSwitcher.css'

export interface LanguageSwitcherProps {
  /** Tighter padding for headers */
  variant?: 'default' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const current = (i18n.language || 'en').split('-')[0] as AppLanguage

  const setLang = useCallback((lng: AppLanguage) => {
    void i18n.changeLanguage(lng)
  }, [])

  const rootClass =
    variant === 'compact'
      ? `language-switcher language-switcher--compact${className ? ` ${className}` : ''}`
      : `language-switcher${className ? ` ${className}` : ''}`

  return (
    <div className={rootClass} role="group" aria-label={t('language.switcherLabel')}>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          className={`language-switcher__btn${current === lng ? ' language-switcher__btn--active' : ''}`}
          onClick={() => setLang(lng)}
          aria-pressed={current === lng}
          lang={lng}
        >
          {t(`language.short.${lng}`)}
        </button>
      ))}
    </div>
  )
}
