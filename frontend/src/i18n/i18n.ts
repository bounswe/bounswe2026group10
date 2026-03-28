import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from '@/locales/en/common.json'
import trCommon from '@/locales/tr/common.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    tr: { common: trCommon },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false },
})

export default i18n
