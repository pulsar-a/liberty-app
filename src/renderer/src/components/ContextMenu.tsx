import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import React, { Fragment } from 'react'

interface ContextMenuItem {
  id: string | number
  separator?: boolean
}

interface ContextMenuLinkItem extends ContextMenuItem {
  label: string
  icon?: IconDefinition
  disabled?: boolean
  onClick?: () => void
  separator?: never
}

interface ContextMenuSeparatorItem extends ContextMenuItem {
  label?: never
  icon?: never
  disabled?: never
  onClick?: never
  separator: boolean
}

type ContextMenuProps = {
  items: (ContextMenuLinkItem | ContextMenuSeparatorItem)[]
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items }) => {
  return (
    <Menu as="div" className="relative flex-none">
      <Menu.Button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white">
        <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" aria-hidden="true" />
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-mako-100 py-2 shadow-xl ring-1 ring-gray-900/5 focus:outline-none dark:bg-mako-800">
          {items.map((item) =>
            item.separator ? (
              <div
                key={item.id}
                className="mb-2 h-0 border-b border-gray-200 pt-2 dark:border-gray-500"
              ></div>
            ) : (
              <Menu.Item key={item.id}>
                <button
                  type="button"
                  className={clsx(
                    'block w-full cursor-default px-3 py-1 text-left text-sm leading-6 text-gray-900 hover:bg-mako-200 hover:shadow-inner dark:text-indigo-50 dark:hover:bg-mako-900'
                  )}
                  onClick={!item.disabled ? item.onClick : undefined}
                >
                  {item.icon && <FontAwesomeIcon icon={item.icon} className="mr-2" />}
                  {item.label}
                </button>
              </Menu.Item>
            )
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
