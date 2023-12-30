import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import React from 'react'

type MainMenuEntriesProps = {
  items: {
    name: string
    to?: string
    icon: IconDefinition
    current: boolean
    fn?: () => void
  }[]
}

export const MainMenuEntries: React.FC<MainMenuEntriesProps> = ({ items }) => {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {items.map((item) => (
        <li key={item.name}>
          <a
            href={item?.to || '#'}
            onClick={item.fn}
            className={clsx(
              item.current
                ? 'bg-indigo-600 dark:bg-gray-800 dark:text-indigo-50 text-white hover:bg-gray-700'
                : 'text-gray-700 hover:text-indigo-500 hover:bg-gray-300 dark:hover:bg-gray-600',
              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
            )}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className={clsx('h-6 w-6 shrink-0')}
              aria-hidden="true"
            />
            <span className="text-grey-700 dark:text-white">{item.name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
