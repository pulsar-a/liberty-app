import { RouteEntry } from '@app-types/router.types'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'

type BookContentsListProps = {
  items: RouteEntry[]
  className?: string
}

export const BookContentsList: React.FC<BookContentsListProps> = ({ items, className }) => {
  return (
    <ul className={clsx('flex flex-col gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            onClick={item.fn}
            activeOptions={{ exact: true, includeSearch: true, includeHash: true }}
            search={item.search}
            hash={item?.hash}
            className={clsx(
              'block cursor-pointer py-2 pl-3 pr-2 text-xs font-medium text-gray-900 hover:underline dark:text-gray-100',
              item.disabled && 'pointer-events-none opacity-50'
            )}
            disabled={item.disabled}
          >
            <div>{item.name}</div>
          </Link>

          {item.children && (
            <div className="ml-3 mt-4 border-l">
              <BookContentsList items={item.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
