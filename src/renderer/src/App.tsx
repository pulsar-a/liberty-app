// import { useQuery } from '@tanstack/react-query'
// import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
// import { LoadingSpinner } from './components/LoadingSpinner'
import { useSettings } from './hooks/useSettings'
import { useTranslation } from 'react-i18next'

export const App = () => {
  // const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false)

  const {
    i18n: { changeLanguage },
  } = useTranslation()

  const { getSetting } = useSettings()

  useEffect(() => {
    changeLanguage(getSetting('language') as string)
    // setSettingsLoaded(true)
  }, [])

  return (
    <>
      {/*{!settingsLoaded && (*/}
      {/*  <div className="flex items-center justify-center h-dvh w-full bg-slate-900">*/}
      {/*    <LoadingSpinner size="lg" />*/}
      {/*  </div>*/}
      {/*)}*/}
      <Outlet />
    </>
  )
}
