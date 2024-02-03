import { clsx } from 'clsx'
import React from 'react'

type DataListEntryProps = {
  label: string
  value?: string | number | null
  breakable?: boolean
  children?: React.ReactNode
  className?: string
}

export const DataListEntry: React.FC<DataListEntryProps> = ({
  label,
  value,
  breakable,
  children,
  className,
}) => {
  return (
    <div className={clsx('flex justify-between py-3 text-sm font-medium', className)}>
      <dt className="text-gray-700 dark:text-gray-300">{label}</dt>
      <dd
        className={clsx('max-w-[50%] text-gray-900 dark:text-gray-100', breakable && 'break-all')}
      >
        {!value && !children ? '-' : value || children}
      </dd>
    </div>
  )
}
