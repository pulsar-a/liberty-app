import { Outlet } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faHome,
  faCog,
  faBookOpen,
  faMagnifyingGlass,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { MainMenuEntries } from './parts/MainMenuEntries'

export const LibraryLayout = () => {
  const { t } = useTranslation()

  const navigation = [
    { name: t('mainMenu_all_title'), to: '/', icon: faHome, current: true },
    {
      name: t('mainMenu_myCollections_title'),
      to: '/my-collections',
      icon: faFolder,
      current: false,
    },
  ]

  const systemNavigation = [
    {
      name: t('mainMenu_settings_title'),
      to: '/settings',
      icon: faCog,
      current: false,
    },
    {
      name: t('mainMenu_quit_title'),
      fn: () => {
        window.close()
      },
      icon: faPowerOff,
      current: false,
    },
  ]

  return (
    <>
      <div>
        <div className="fixed inset-y-0 z-50 flex w-60 flex-col">
          <div className="flex grow flex-col gap-y-8 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-6 pt-3">
            {/* LOGO */}
            <div className="flex h-16 pt-4 shrink-0 items-center gap-2 dark:text-indigo-300 text-indigo-700 justify-center font-semibold text-2xl">
              <FontAwesomeIcon icon={faBookOpen} className="block h-8 w-auto text-indigo-600" />
              <div>Liberty</div>
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
                <li className="mt-auto mb-8 flex items-center justify-center">
                  <DarkModeToggle />
                </li>
              </ul>
            </nav>
            {/* /MAIN MENU */}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="pl-56">
          <div className="sticky ml-60 top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white shadow-sm sm:gap-x-6 px-8 dark:bg-slate-900">
            <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
              <form className="relative flex flex-1" action="#" method="GET">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 bg-white dark:bg-slate-900 py-0 pl-8 pr-0 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder={t('searchbar_placeholder')}
                  type="search"
                  name="search"
                />
              </form>
              <div className="flex items-center gap-x-4 md:gap-x-6">{/* RIGHT Side */}</div>
            </div>
          </div>
        </div>
        {/* /SEARCH BAR */}

        <Outlet />
      </div>
    </>
  )
}
