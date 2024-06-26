import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Listbox, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import React, { Fragment } from 'react'

export type SelectOption = {
  label: string
  value: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  disabled?: boolean
}

export type SelectProps = {
  label?: string
  options: SelectOption[]
  value: string | undefined
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string | undefined) => void
}

export const Select: React.FC<SelectProps> = ({
  label,
  options = [],
  value,
  onChange,
  disabled,
}) => {
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
              {label}
            </Listbox.Label>
          )}
          <div className="relative mt-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-indigo-50 py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 dark:bg-mako-950 dark:text-white dark:ring-mako-200/40">
              <span className="flex items-center">
                {/* LEADING ICON */}
                <span className="ml-3 block truncate">{selectedLabel}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-700">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.label}
                    className={({ active }) =>
                      clsx(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-white',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center">
                          {/* LEADING ICON */}
                          <span
                            className={clsx(
                              selected ? 'font-semibold' : 'font-normal',
                              'ml-3 block truncate'
                            )}
                          >
                            {option.label}
                          </span>
                        </div>
                        {selected ? (
                          <span
                            className={clsx(
                              'absolute inset-y-0 right-0 flex items-center pr-4 text-gray-800 dark:text-white'
                            )}
                          >
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  )
}
