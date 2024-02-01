import { clsx } from 'clsx'
import React from 'react'

type DataListEntryProps = {
  label: string
  value?: string | number | null
  children?: React.ReactNode
  className?: string
}

export const DataListEntry: React.FC<DataListEntryProps> = ({
  label,
  value,
  children,
  className,
}) => {
  return (
    <div className={clsx('flex justify-between py-3 text-sm font-medium', className)}>
      <dt className="text-gray-500 dark:text-gray-300">{label}</dt>
      <dd className="text-gray-900 dark:text-gray-100">
        {!value && !children ? '-' : value || children}
      </dd>
    </div>
  )
}
