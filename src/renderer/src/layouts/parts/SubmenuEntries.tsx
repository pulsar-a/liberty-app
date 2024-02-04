import { RouteEntry } from '@app-types/router.types'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'

type SubmenuEntriesProps = {
  items: RouteEntry[]
  className?: string
}

export const SubmenuEntries: React.FC<SubmenuEntriesProps> = ({ items, className }) => {
  return (
    <ul className={clsx('flex flex-col gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item?.to || '#'}
            onClick={item.fn}
            activeOptions={{ exact: true, includeSearch: true }}
            activeProps={{
              className:
                'font-semibold dark:text-white border-indigo-500 dark:border-white/50 bg-indigo-300 dark:bg-white/10',
            }}
            search={item.search}
            className={clsx(
              'block cursor-default rounded-md border-r-4 border-transparent py-2 pl-3 pr-2 text-sm font-medium text-gray-900 hover:border-black hover:bg-gray-600/15 dark:text-gray-300 dark:hover:border-white dark:hover:bg-white/15',
              item.disabled && 'pointer-events-none opacity-50',
              item.active &&
                'border-indigo-500 bg-indigo-300 font-semibold dark:border-white/50 dark:bg-white/10 dark:text-white'
            )}
            disabled={item.disabled}
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
