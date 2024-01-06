import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchDropdownBookEntry } from './SearchDropdownBookEntry'

export const GlobalSearch: React.FC = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [publishingOptions, setPublishingOptions] = useState([
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

  return (
    <>
      <Listbox>
        <div className="relative mt-2">
          <div className="fixed left-0 right-0 top-0 z-10 pl-60">
            <div className="sticky top-0 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-6 shadow sm:gap-x-6 dark:border-gray-800 dark:bg-mako-950">
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
                    value={searchTerm}
                    name="search"
                    autoComplete="off"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length > 0 && setOpen(true)}
                    onBlur={() => setOpen(false)}
                  />
                </form>
                <div className="flex items-center gap-x-4 md:gap-x-6">{/* RIGHT Side */}</div>
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
