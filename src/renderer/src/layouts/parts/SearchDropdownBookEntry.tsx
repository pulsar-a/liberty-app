import { Listbox } from '@headlessui/react'

type SearchDropdownBookEntryProps = {
  option: {
    title: string
    description: string
  }
}

export const SearchDropdownBookEntry: React.FC<SearchDropdownBookEntryProps> = ({ option }) => {
  return (
    <Listbox.Option
      key={option.title}
      className="cursor-default select-none p-4 text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-bright-gray-700/50"
      value={option}
    >
      <div className="flex flex-col">
        <div className="flex justify-between">
          <p className="font-normal">{option.title}</p>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-300">{option.description}</p>
      </div>
    </Listbox.Option>
  )
}
