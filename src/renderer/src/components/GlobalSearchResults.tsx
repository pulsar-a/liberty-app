import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { SearchDropdownBookEntry } from '../layouts/parts/SearchDropdownBookEntry'

type GlobalSearchResultsProps = {
  open: boolean
  result: {
    books: {
      name: string
      cover: string
      authors: string[]
    }[]
    collections: string[]
    authors: string[]
  }
}
export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ open, result }) => {
  return (
    <Transition
      show={open}
      as={Fragment}
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Listbox.Options className="absolute left-0 right-0 z-10 ml-64 mr-24 mt-16 origin-top-left divide-y divide-mako-700 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-bright-gray-900">
        {result.books.map((option) => (
          <SearchDropdownBookEntry option={option} key={option.name} />
        ))}
      </Listbox.Options>
    </Transition>
  )
}
