import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Listbox, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { grabIsMac, usePlatformStore } from '../../store/usePlatformStore'
import { SearchDropdownBookEntry } from './SearchDropdownBookEntry'

export const GlobalSearch: React.FC = () => {
  const { t } = useTranslation()
  const isMac = usePlatformStore(grabIsMac)
  const [open, setOpen] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [publishingOptions] = useState([
    {
      title: 'All',
      description: 'Search all books',
    },
    {
      title: 'Published',
      description: 'Search only published books',
    },
    {
      title: 'Unpublished',
      description: 'Search only unpublished books',
    },
  ])

  useEffect(() => {
    setOpen(searchTerm.length > 0)
  }, [searchTerm])

  const handleFocus = () => {
    searchTerm.length > 0 && setOpen(true)
  }

  const handleBlur = () => {
    setOpen(false)
  }

  const withShortcuts = false

  return (
    <>
      <Listbox>
        <div className="relative mt-2">
          <div className="fixed left-0 right-0 top-0 z-10 pl-60">
            <div
              className={clsx(
                'sticky top-0 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-mako-50 px-6 shadow transition-colors focus-within:bg-white sm:gap-x-6 dark:border-gray-800 dark:bg-mako-950 focus-within:dark:bg-mako-900'
              )}
            >
              <div className="flex flex-1 gap-x-4 self-stretch md:gap-x-6">
                <div className="relative flex flex-1">
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
                    value={searchTerm}
                    name="search"
                    autoComplete="off"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="flex items-center gap-x-4 md:gap-x-6">
                  {withShortcuts && (
                    <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1 font-mono text-lg text-gray-400 dark:border-gray-700 dark:bg-mako-800">
                      {isMac ? '⌘' : 'Ctrl + '}K
                    </kbd>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute left-0 right-0 z-10 ml-64 mr-24 mt-16 origin-top-left divide-y divide-mako-700 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-bright-gray-900">
              {publishingOptions.map((option) => (
                <SearchDropdownBookEntry option={option} key={option.title} />
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </>
  )
}
