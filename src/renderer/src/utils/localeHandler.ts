import { setDefaultOptions } from 'date-fns'
import { de, enUS, ru, tr, uk } from 'date-fns/locale'

export const setDateLocale = (locale: string): void => {
  const fnsLocalesMap = {
    en: enUS,
    ru,
    de,
    tt: tr,
    ua: uk,
  }

  setDefaultOptions({ locale: fnsLocalesMap[locale] })
}
