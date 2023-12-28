import i18n from 'i18next'
import enJSON from './locale/en.json'
import ruJSON from './locale/ru.json'
import deJSON from './locale/de.json'

import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    en: enJSON,
    ru: ruJSON,
    de: deJSON,
  },
  lng: 'en',
})
