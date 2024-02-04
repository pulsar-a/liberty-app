import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import React, { Fragment } from 'react'

type ContextMenuProps = {
  items: {
    id: string | number
    label: string
    icon?: IconDefinition
    disabled?: boolean
    onClick?: () => void
  }[]
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items }) => {
  return (
    <Menu as="div" className="relative flex-none">
      <Menu.Button className="-m-2.5 block cursor-default p-2.5 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-100 hover:dark:text-indigo-300">
        <FontAwesomeIcon icon={faEllipsisV} className="h-5 w-5" aria-hidden="true" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none dark:bg-mako-800">
          {items.map((item) => (
            <Menu.Item key={item.label}>
              <a
                href="#"
                className={clsx(
                  'block cursor-default px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-100 hover:shadow-inner dark:text-indigo-50 dark:hover:bg-gray-700'
                )}
                onClick={!item.disabled ? item.onClick : undefined}
              >
                {item.icon && <FontAwesomeIcon icon={item.icon} className="mr-2" />}
                {item.label}
              </a>
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
