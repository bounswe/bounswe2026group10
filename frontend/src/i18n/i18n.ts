import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/locales/en/common.json'
import trCommon from '@/locales/tr/common.json'
import { getStoredLanguage, persistLanguage } from '@/lib/language-storage'

const initialLng = getStoredLanguage()

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    tr: { common: trCommon },
  },
  lng: initialLng,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  persistLanguage(lng)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.split('-')[0] || 'en'
  }
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng
}

export default i18n
