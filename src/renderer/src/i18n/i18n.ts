import i18n from 'i18next'

import { initReactI18next } from 'react-i18next'
import deJSON from './locale/de.json'
import enJSON from './locale/en.json'
import ruJSON from './locale/ru.json'
import ttJSON from './locale/tt.json'
import uaJSON from './locale/ua.json'

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

export default i18n
