import { clsx } from 'clsx'

type SubmenuEntriesProps = {
  items: {
    name: string
    to?: string
    fn?: () => void
    id: string | number
    current: boolean
    disabled?: boolean
  }[]
}

export const SubmenuEntries: React.FC<SubmenuEntriesProps> = ({ items }) => {
  return (
    <ul className="flex flex-col gap-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className={clsx(
            'py-2 px-4 hover:bg-gray-600/15 dark:hover:bg-white/15 dark:text-white text-gray-900 rounded-md text-sm border-r-4 border-transparent dark:hover:border-white hover:border-black font-medium cursor-pointer',
            item.current && 'font-semibold dark:bg-white/5 bg-gray-300 border-indigo-600'
          )}
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}
