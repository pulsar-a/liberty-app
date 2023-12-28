// import { useQuery } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { SettingsType } from '../../../types/settings.types'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useSettingsStore } from './store/useSettingsStore'
import { useTranslation } from 'react-i18next'
// import { useSettings } from './hooks/useSettings'

export const App = () => {
  const { setInitialSettings } = useSettingsStore()
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false)

  useQuery({
    queryKey: ['settings'],
    queryFn: () => window.api.getAllSettings(),
    enabled: !settingsLoaded,
    onSuccess: (data) => {
      console.log('WORKS', data)
      setInitialSettings(data as SettingsType)
      setSettingsLoaded(true)
      changeLanguage(data.language as unknown as string)
    },
  })

  const {
    i18n: { changeLanguage },
  } = useTranslation()

  return (
    <>
      {!settingsLoaded && (
        <div className="flex items-center justify-center h-dvh w-full bg-slate-900">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {settingsLoaded && <Outlet />}
    </>
  )
}
