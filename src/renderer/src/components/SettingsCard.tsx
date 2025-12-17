import { clsx } from 'clsx'
import React from 'react'

type SettingsCardProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-mako-700 dark:bg-mako-900/50',
        className
      )}
    >
      <div className="border-b border-gray-100 px-5 py-4 dark:border-mako-700/50">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-mako-400">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

