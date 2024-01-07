import { faRemove } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
  withRemove?: boolean | true
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
  withRemove = true,
  className,
}) => {
  const clearInput = () => {
    onChange('')
  }

  return (
    <div className={clsx(className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium leading-6 text-gray-950 dark:text-white"
        >
          {label}
        </label>
      )}
      <div className="mt-2">
        <div
          className={clsx(
            'relative flex rounded-md bg-indigo-50 ring-1 ring-inset ring-indigo-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 dark:bg-white/5 dark:ring-white/10',
            withRemove && 'pr-4'
          )}
        >
          {prefix && (
            <span className="flex select-none items-center pl-3 text-indigo-700 sm:text-sm dark:text-gray-400">
              {prefix}
            </span>
          )}
          <input
            type={type}
            name={name}
            id={id}
            value={value}
            className={clsx(
              'flex-1 overflow-hidden border-0 bg-transparent py-1.5 text-gray-900 focus:ring-0 sm:text-sm sm:leading-6 dark:text-white',
              prefix ? 'pl-2' : 'pl-4'
            )}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {withRemove && value?.length !== 0 && (
            <button
              className="absolute inset-y-0 right-0 flex cursor-default items-center pr-3 hover:text-mako-400 dark:hover:text-mako-200"
              onClick={clearInput}
            >
              <FontAwesomeIcon icon={faRemove} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
