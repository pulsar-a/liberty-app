import { clsx } from 'clsx'
import React, { ReactNode } from 'react'

type TextInputProps = {
  value: string
  label?: string
  name?: string
  type?: 'text' | 'password' | 'email' | 'number'
  placeholder?: string
  id?: string
  prefix?: string | ReactNode
  onChange: (value: string) => void
  className?: string
}
export const TextInput: React.FC<TextInputProps> = ({
  label,
  prefix,
  value,
  onChange,
  type,
  name,
  id,
  placeholder,
  className,
}) => {
  return (
    <div className={clsx(className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium leading-6 dark:text-white text-gray-950"
        >
          {label}
        </label>
      )}
      <div className="mt-2">
        <div className="flex rounded-md dark:bg-white/5 bg-indigo-50 ring-1 ring-inset ring-indigo-700 dark:ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
          {prefix && (
            <span className="flex select-none items-center pl-3 text-indigo-700 dark:text-gray-400 sm:text-sm">
              {prefix}
            </span>
          )}
          <input
            type={type}
            name={name}
            id={id}
            value={value}
            className={clsx(
              'flex-1 border-0 bg-transparent py-1.5 text-gray-900 dark:text-white focus:ring-0 sm:text-sm sm:leading-6',
              prefix ? 'pl-2' : 'pl-4'
            )}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  )
}
