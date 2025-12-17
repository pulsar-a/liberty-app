import { clsx } from 'clsx'
import React from 'react'

type SettingsRowProps = {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
  vertical?: boolean
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  className,
  vertical = false,
}) => {
  return (
    <div
      className={clsx(
        'py-3 first:pt-0 last:pb-0',
        !vertical && 'sm:flex sm:items-start sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className={clsx('min-w-0 flex-1', !vertical && 'sm:max-w-xs')}>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-mako-400">{description}</p>
        )}
      </div>
      <div className={clsx('mt-2', !vertical && 'sm:mt-0 sm:flex-shrink-0')}>{children}</div>
    </div>
  )
}

