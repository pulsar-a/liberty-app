import { Outlet } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFolder,
  faHome,
  // faUser,
  faCog,
  faBookOpen,
  faMagnifyingGlass,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const navigation = [
  { name: 'mainMenu_all_title', to: '/', icon: faHome, current: true },
  // { name: 'mainMenu_authors_title', to: '/by-author', icon: faUser, current: false },
  {
    name: 'mainMenu_myCollections_title',
    to: '/my-collections',
    icon: faFolder,
    current: false,
  },
]

const systemNavigation = [
  {
    name: 'mainMenu_settings_title',
    to: '/settings',
    icon: faCog,
    current: false,
  },
  {
    name: 'mainMenu_quit_title',
    fn: () => {
      window.close()
    },
    icon: faPowerOff,
    current: false,
  },
]
// const userNavigation = [
//   { name: 'settings', to: '/settings' },
//   { name: 'Quit', to: '/' },
// ]

export const LibraryLayout = () => {
  const { t } = useTranslation()
  // const [sidebarOpen, setSidebarOpen] = useState(false)

  const [authors, setAuthors] = useState([
    { id: 1, name: 'Stephen King' },
    { id: 2, name: 'Sir Arthur Conan Doyle' },
  ])

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white">
        <body class="h-full">
        ```
      */}
      <div>
        {/* Static sidebar for desktop */}
        <div className="fixed inset-y-0 z-50 flex w-56 flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-2 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-6 pt-3">
            <div className="flex h-16 shrink-0 items-center gap-2 text-grey-500 justify-center">
              <FontAwesomeIcon icon={faBookOpen} className="block h-8 w-auto" />
              <div>Liberty</div>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.to}
                          className={clsx(
                            item.current
                              ? 'bg-gray-50 dark:bg-gray-800 text-indigo-500 hover:bg-gray-700'
                              : 'text-gray-700 hover:text-indigo-500 hover:bg-gray-700 dark:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className={clsx(
                              item.current
                                ? 'text-indigo-500'
                                : 'text-gray-400 group-hover:text-indigo-500',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-grey-700 dark:text-white">{t(item.name)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 dark:text-gray-100">
                    System
                  </div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {systemNavigation.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item?.to || '#'}
                          onClick={item.fn}
                          className={clsx(
                            item.current
                              ? 'bg-gray-50 dark:bg-gray-800 text-indigo-600 hover:bg-gray-700'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-700 dark:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            className={clsx(
                              item.current
                                ? 'text-indigo-600'
                                : 'text-gray-600 group-hover:text-indigo-600',
                              'h-6 w-6 shrink-0'
                            )}
                          />
                          {/*<span*/}
                          {/*  className={clsx(*/}
                          {/*    team.current*/}
                          {/*      ? 'text-indigo-600 border-indigo-600'*/}
                          {/*      : 'text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600',*/}
                          {/*    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white'*/}
                          {/*  )}*/}
                          {/*>*/}
                          {/*  {team.initial}*/}
                          {/*</span>*/}
                          <span className="text-grey-700 dark:text-white">{t(item.name)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="mt-auto mb-8">
                  <a
                    onClick={() => {
                      window.close()
                    }}
                    className={clsx(
                      'text-gray-700 hover:text-indigo-600 hover:bg-gray-700 dark:text-white',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <FontAwesomeIcon
                      icon={faPowerOff}
                      className={clsx(
                        'text-gray-600 group-hover:text-indigo-600',
                        'h-6 w-6 shrink-0'
                      )}
                    />
                    {/*<span*/}
                    {/*  className={clsx(*/}
                    {/*    team.current*/}
                    {/*      ? 'text-indigo-600 border-indigo-600'*/}
                    {/*      : 'text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600',*/}
                    {/*    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white'*/}
                    {/*  )}*/}
                    {/*>*/}
                    {/*  {team.initial}*/}
                    {/*</span>*/}
                    <span className="text-grey-700 dark:text-white">
                      {t('mainMenu_quit_title')}
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="pl-56">
          <div className="sticky ml-56 top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white shadow-sm sm:gap-x-6 px-8 dark:bg-slate-900">
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

        <Outlet />

        {/*<main className="pl-56">*/}
        {/*  <div className="pl-56">*/}
        {/*    <div className="px-8 py-6 bg-white h-dvh -mt-16 pt-24 dark:bg-slate-900">*/}
        {/*      <Outlet />*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</main>*/}

        {/*<aside className="fixed bg-white inset-y-0 left-56 w-56 overflow-y-auto border-r border-gray-200 dark:border-gray-700 px-4 py-6 block dark:bg-slate-900">*/}
        {/*  /!* Secondary column *!/*/}
        {/*  {authors.map((author) => (*/}
        {/*    <div key={author.id} className="flex items-center gap-x-4">*/}
        {/*      <span className="text-sm font-medium text-gray-900 dark:text-white">*/}
        {/*        {author.name}*/}
        {/*      </span>*/}
        {/*    </div>*/}
        {/*  ))}*/}
        {/*</aside>*/}
      </div>
    </>
  )
}
