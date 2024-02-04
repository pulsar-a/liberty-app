import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'

type ButtonGroupProps = {
  items: {
    label?: string
    icon?: IconDefinition
    active?: boolean
    disabled?: boolean
    onClick?: () => void
  }[]
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ items }) => {
  return (
    <span className="isolate inline-flex rounded-md shadow-sm">
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          className={clsx(
            'relative inline-flex cursor-default items-center justify-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 first:rounded-l-md last:rounded-r-md focus:z-10 dark:bg-mako-700 dark:text-indigo-100 dark:ring-gray-700',
            item.active
              ? 'bg-indigo-600 text-white shadow-inner dark:bg-indigo-500'
              : ' hover:bg-gray-50 dark:hover:bg-mako-600 dark:hover:text-white '
          )}
          onClick={!item.disabled ? item.onClick : undefined}
        >
          {item.icon && <FontAwesomeIcon icon={item.icon} className="" />}
          {item.label}
        </button>
      ))}
    </span>
  )
}
