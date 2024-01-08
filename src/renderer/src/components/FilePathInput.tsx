import { faDeleteLeft, faEllipsis, faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'

type TextInputProps = {
  value: string
  label?: string
  name?: string
  type?: 'text'
  folder?: boolean
  placeholder?: string
  id?: string
  onChange: (value: string) => void
  className?: string
}

export const FilePathInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  type,
  name,
  folder,
  id,
  placeholder,
  className,
}) => {
  const { t } = useTranslation()
  const handleButtonClick = async () => {
    const result = await window.api.selectFolder()

    if (result) {
      onChange(result)
    }
  }

  const handleClearButtonClick = async () => {
    onChange('')
  }

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium leading-6 text-gray-950 dark:text-white"
        >
          {label}
        </label>
      )}

      <div className="mt-2 flex w-full rounded-md shadow-inner">
        <div className="relative flex w-full rounded-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FontAwesomeIcon
              icon={folder ? faFolder : faFile}
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type={type}
            name={name}
            id={id}
            value={value}
            className={clsx(
              'block  w-full rounded-none rounded-l-md border-0 bg-mako-50 py-1.5 pl-10 text-gray-900 shadow-inner ring-1 ring-inset ring-gray-500 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-mako-950 dark:text-white dark:ring-mako-200/40 dark:focus:bg-mako-900'
            )}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <button
          type="button"
          className="relative -ml-px inline-flex cursor-default items-center gap-x-1.5 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-500 hover:bg-gray-50 dark:bg-indigo-300/10 dark:text-white dark:ring-mako-200/40 dark:hover:bg-indigo-300/20"
          title={t('Use default system path')}
          onClick={handleClearButtonClick}
        >
          <FontAwesomeIcon
            icon={faDeleteLeft}
            className="-ml-0.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="relative -ml-px inline-flex cursor-default items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-500 hover:bg-gray-50 dark:bg-indigo-300/10 dark:text-white dark:ring-mako-200/40 dark:hover:bg-indigo-300/20"
          title={t('Choose folder')}
          onClick={handleButtonClick}
        >
          <FontAwesomeIcon
            icon={faEllipsis}
            className="-ml-0.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
