import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import { useTranslation } from 'react-i18next'

export const App = () => {
  const {
    i18n: { changeLanguage },
  } = useTranslation()

  const { getSetting } = useSettings()

  useEffect(() => {
    changeLanguage(getSetting('language') as string)
  }, [])

  return (
    <>
      <Outlet />
    </>
  )
}
