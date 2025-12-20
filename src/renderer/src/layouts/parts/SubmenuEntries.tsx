import { RouteEntry } from '@app-types/router.types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'

type SubmenuEntriesProps = {
  items: RouteEntry[]
  className?: string
}

export const SubmenuEntries: React.FC<SubmenuEntriesProps> = ({ items, className }) => {
  return (
    <ul className={clsx('flex flex-col gap-y-1.5', className)}>
      {items.map((item) => {
        const isFavorite = item.variant === 'favorite'

        return (
          <li key={item.id}>
            <Link
              to={item?.to || '/'}
              onClick={item.fn}
              activeOptions={{ exact: true, includeSearch: true }}
              activeProps={{
                className: isFavorite
                  ? 'font-semibold text-amber-900 dark:text-amber-100 border-amber-500 dark:border-amber-400 bg-amber-200 dark:bg-amber-900/40'
                  : 'font-semibold dark:text-white border-indigo-500 dark:border-white/50 bg-indigo-300 dark:bg-white/10',
              }}
              search={item.search}
              className={clsx(
                'flex items-center justify-between cursor-default rounded-md border-r-4 border-transparent py-2 pl-3 pr-2 text-sm font-medium',
                item.disabled && 'pointer-events-none opacity-50',
                isFavorite
                  ? 'text-amber-800 hover:border-amber-600 hover:bg-amber-100 dark:text-amber-300 dark:hover:border-amber-400 dark:hover:bg-amber-900/30'
                  : 'text-gray-900 hover:border-black hover:bg-gray-600/15 dark:text-gray-300 dark:hover:border-white dark:hover:bg-white/15',
                item.active &&
                  (isFavorite
                    ? 'border-amber-500 bg-amber-200 font-semibold dark:border-amber-400 dark:bg-amber-900/40 dark:text-amber-100'
                    : 'border-indigo-500 bg-indigo-300 font-semibold dark:border-white/50 dark:bg-white/10 dark:text-white')
              )}
              disabled={item.disabled}
            >
              <span className="flex items-center gap-2 truncate">
                {item.icon && (
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={clsx(
                      'h-4 w-4',
                      isFavorite ? 'text-amber-600 dark:text-amber-400' : ''
                    )}
                  />
                )}
                {item.name}
              </span>
              {item.count !== undefined && (
                <span
                  className={clsx(
                    'ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums',
                    isFavorite
                      ? 'bg-amber-300/50 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300'
                      : 'bg-gray-400/30 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
