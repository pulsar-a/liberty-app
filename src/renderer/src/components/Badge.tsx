import { clsx } from 'clsx'

type BadgeProps = {
  label: string
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'pink' | 'purple' | 'indigo'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ label, color, className }) => {
  return (
    <span
      className={clsx(
        'inline-flex cursor-default items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        {
          'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20':
            !color || color === 'gray',
          'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20':
            color === 'red',
          'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20':
            color === 'yellow',
          'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20':
            color === 'green',
          'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30':
            color === 'blue',
          'bg-indigo-50 text-indigo-700 ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30':
            color === 'indigo',
          'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30':
            color === 'purple',
          'bg-pink-50 text-pink-700 ring-pink-700/10 dark:bg-pink-400/10 dark:text-pink-400 dark:ring-pink-400/20':
            color === 'pink',
        },
        className
      )}
    >
      {label}
    </span>
  )
}
