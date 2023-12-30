import i18n from 'i18next'
import enJSON from './locale/en.json'
import deJSON from './locale/de.json'
import ruJSON from './locale/ru.json'
import ttJSON from './locale/tt.json'
import uaJSON from './locale/ua.json'

import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    en: enJSON,
    de: deJSON,
    ru: ruJSON,
    tt: ttJSON,
    ua: uaJSON,
  },
  lng: 'en',
})
