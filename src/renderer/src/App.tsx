import { Outlet } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from './hooks/useSettings'

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
      <Suspense>
        <Outlet />
      </Suspense>
    </>
  )
}
