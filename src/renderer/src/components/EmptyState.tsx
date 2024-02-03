import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'

type EmptyStateProps = {
  message: string
  details?: string | null
  type?: 'error' | 'info' | 'action'
  icon?: IconDefinition
  onClick?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  details = null,
  type = 'info',
  icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative block w-full cursor-default rounded-lg border-2 border-dashed p-12 text-center',
        type === 'error' && 'border-red-400 dark:border-red-600/40',
        type === 'info' && 'border-gray-300 dark:border-gray-600',
        type === 'action' &&
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-300'
      )}
    >
      {type === 'action' && icon && (
        <FontAwesomeIcon icon={icon} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
      )}

      {type === 'error' && (
        <FontAwesomeIcon
          icon={icon || faCircleExclamation}
          className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-red-400"
        />
      )}
      {type === 'info' && (
        <FontAwesomeIcon
          icon={icon || faCircleInfo}
          className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-indigo-300"
        />
      )}
      <div className="block text-sm font-semibold text-gray-900 dark:text-indigo-50">{message}</div>
      {details && <div className="mt-2 text-sm text-gray-500 dark:text-indigo-100">{details}</div>}
    </button>
  )
}
