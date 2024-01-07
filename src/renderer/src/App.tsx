import { Outlet } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useIpc } from './hooks/useIpc'
import { useSettings } from './hooks/useSettings'
import { usePlatformStore } from './store/usePlatformStore'

export const App = () => {
  const {
    i18n: { changeLanguage },
  } = useTranslation()
  const { setPlatform, platform } = usePlatformStore()
  const { main } = useIpc()
  main.getPlatformData.useQuery(undefined, {
    enabled: platform === null,
    queryKey: ['getPlatformData', undefined],
    onSuccess: (data) => {
      setPlatform(data.platform)
    },
  })

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
