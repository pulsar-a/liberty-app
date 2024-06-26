import logoDark from '@/assets/images/logos/logo-dark.svg'
import logoLight from '@/assets/images/logos/logo-light.svg'
import { faHeart } from '@fortawesome/free-regular-svg-icons'
import { faBook, faCog, faTabletScreenButton } from '@fortawesome/free-solid-svg-icons'
import { Outlet, ScrollRestoration } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { GlobalSearch } from './parts/GlobalSearch'
import { MainMenuEntries } from './parts/MainMenuEntries'

export const LibraryLayout = () => {
  const { t } = useTranslation()

  const navigation = [
    { id: 'all-books', name: t('mainMenu_allBooks_title'), to: '/', icon: faBook, current: true },
    {
      id: 'my-collections',
      name: t('mainMenu_myCollections_title'),
      to: '/my-collections',
      icon: faHeart,
    },
    {
      id: '',
      name: t('mainMenu_reader_title'),
      to: '/reader',
      icon: faTabletScreenButton,
    },
  ]

  const systemNavigation = [
    {
      id: 'settings',
      name: t('mainMenu_settings_title'),
      to: '/settings',
      icon: faCog,
    },
  ]

  return (
    <>
      <div className="h-dvh select-none overflow-hidden">
        <div className="fixed inset-y-0 z-50 flex w-60 flex-col">
          <div className="flex grow flex-col gap-y-8 border-r border-gray-200 px-4 pt-3 shadow-2xl dark:border-gray-800">
            {/* LOGO */}
            <div className="pointer-events-none flex h-16 shrink-0 items-center justify-center gap-2 pt-4 text-2xl font-semibold text-mako-800 dark:text-indigo-200/70">
              <img src={logoLight} alt="Liberty" className="block h-14 w-auto dark:hidden" />
              <img src={logoDark} alt="Liberty" className="hidden h-14 w-auto dark:block" />
            </div>
            {/* /LOGO */}

            {/* MAIN MENU */}
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <MainMenuEntries items={navigation} />
                </li>
                <li>
                  <MainMenuEntries items={systemNavigation} />
                </li>
                <li className="-mx-4 mt-auto flex h-24 flex-col items-center justify-center border-t border-indigo-500/15 shadow-inner dark:border-gray-700/70 dark:shadow-inner">
                  <DarkModeToggle />
                </li>
              </ul>
            </nav>
            {/* /MAIN MENU */}
          </div>
        </div>

        {/* SEARCH BAR */}
        <GlobalSearch />
        {/* /SEARCH BAR */}

        <ScrollRestoration />
        <Outlet />
      </div>
    </>
  )
}
