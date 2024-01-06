import {
  faBookOpen,
  faCog,
  faFolder,
  faHome,
  faMagnifyingGlass,
  faPowerOff,
  faTabletScreenButton,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { MainMenuEntries } from './parts/MainMenuEntries'

export const LibraryLayout = () => {
  const { t } = useTranslation()

  const navigation = [
    { id: 'all-books', name: t('mainMenu_allBooks_title'), to: '/', icon: faHome, current: true },
    {
      id: 'my-collections',
      name: t('mainMenu_myCollections_title'),
      to: '/my-collections',
      icon: faFolder,
      current: false,
    },
    {
      id: '',
      name: t('mainMenu_reader_title'),
      to: '/reader',
      icon: faTabletScreenButton,
      current: false,
    },
  ]

  const systemNavigation = [
    {
      id: 'settings',
      name: t('mainMenu_settings_title'),
      to: '/settings',
      icon: faCog,
      current: false,
    },
    {
      id: 'quit',
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
      <div className="h-dvh">
        <div className="fixed inset-y-0 z-50 flex w-60 flex-col">
          <div className="flex grow flex-col gap-y-8 border-r border-gray-200 px-4 pt-3 shadow-xl dark:border-gray-800">
            {/* LOGO */}
            <div className="text-mako-800 flex h-16 shrink-0 items-center justify-center gap-2 pt-4 text-2xl font-semibold dark:text-indigo-200/70">
              <FontAwesomeIcon icon={faBookOpen} className="block h-8 w-auto text-indigo-500" />
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
                <li className="-mx-4 mt-auto flex h-24 flex-col items-center justify-center border-t border-indigo-500/15 shadow-inner dark:border-gray-700/70 dark:shadow-inner">
                  <DarkModeToggle />
                </li>
              </ul>
            </nav>
            {/* /MAIN MENU */}
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="fixed left-0 right-0 top-0 z-10 pl-60">
          <div className="sticky top-0 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 shadow-sm sm:gap-x-6 dark:border-gray-800 dark:bg-woodsmoke-950">
            <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
              <form className="relative flex flex-1" action="#">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm dark:text-white"
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
