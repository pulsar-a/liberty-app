import { RouteEntry } from '@app-types/router.types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'

type MainMenuEntriesProps = {
  items: RouteEntry[]
}

export const MainMenuEntries: React.FC<MainMenuEntriesProps> = ({ items }) => {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {items.map((item) => (
        <li key={item.name}>
          <Link
            to={item?.to || '#'}
            onClick={item.fn}
            activeProps={{
              className:
                'bg-indigo-600 text-white hover:bg-gray-700 dark:bg-gray-800 dark:text-indigo-50',
            }}
            inactiveProps={{
              className:
                'text-gray-700 hover:bg-gray-300 hover:text-indigo-500 dark:hover:bg-gray-600',
            }}
            className={clsx(
              'group flex gap-x-3 rounded-md py-3 pl-3 pr-2 text-sm font-semibold leading-6'
            )}
          >
            {item.icon && (
              <FontAwesomeIcon
                icon={item.icon}
                className={clsx('h-6 w-6 shrink-0')}
                aria-hidden="true"
              />
            )}
            <span className="text-grey-700 dark:text-white">{item.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
