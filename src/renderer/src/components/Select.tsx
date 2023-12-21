import React, { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { clsx } from 'clsx'

export type SelectOption = {
  label: string
  value: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  disabled?: boolean
}

export type SelectProps = {
  options: SelectOption[]
  value: string | undefined
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string | undefined) => void
}

export const Select: React.FC<SelectProps> = ({ options = [], value, onChange, disabled }) => {
  const [selected, setSelected] = useState(
    options.find((item) => item.value === value) || options[0] || ({} as SelectOption)
  )

  const handleChange = (item: SelectOption) => {
    setSelected(item)
    onChange?.(item.value)
  }

  return (
    <Listbox value={selected} onChange={handleChange} disabled={disabled}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900">
            Assigned to
          </Listbox.Label>
          <div className="relative mt-2">
            <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="flex items-center">
                {/* LEADING ICON */}
                <span className="ml-3 block truncate">{selected.label}</span>
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
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.label}
                    className={({ active }) =>
                      clsx(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
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
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
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
