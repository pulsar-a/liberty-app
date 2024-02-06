import { Listbox } from '@headlessui/react'

type SearchDropdownBookEntryProps = {
  option: {
    name: string
    authors: string[]
  }
}

export const SearchDropdownBookEntry: React.FC<SearchDropdownBookEntryProps> = ({ option }) => {
  return (
    <Listbox.Option
      key={option.name}
      className="cursor-default select-none p-4 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-bright-gray-700/50"
      value={option}
    >
      <div className="flex flex-col">
        <div className="flex justify-between">
          <p className="font-normal">{option.name}</p>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-300">{option.authors.join(', ')}</p>
      </div>
    </Listbox.Option>
  )
}
