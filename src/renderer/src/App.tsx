// import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSettingsStore } from './store/useSettingsStore'
import { useTranslation } from 'react-i18next'
// import { useSettings } from './hooks/useSettings'

export const App = () => {
  const { get } = useSettingsStore()
  // const settings = useSettings()
  const {
    i18n: { changeLanguage },
  } = useTranslation()
  //
  // const language = settings.get('language', 'en')
  //
  // changeLanguage(language as string)
  useEffect(() => {
    const language = get('language', 'en')
    changeLanguage(language as string)
  }, [])

  return <Outlet />
}
