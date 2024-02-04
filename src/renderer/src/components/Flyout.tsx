import { faClose } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Dialog, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
// import { PencilIcon, PlusIcon } from '@heroicons/react/20/solid'
// import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline'
import React, { Fragment } from 'react'

export type FlyoutProps = {
  children: React.ReactNode
  open: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onClose: () => void
}

export const Flyout: React.FC<FlyoutProps> = ({ children, open, size, onClose }) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-55 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={clsx('pointer-events-auto relative w-screen', {
                    'max-w-96': !size,
                    'max-w-80': size === 'xs',
                    'max-w-lg': size === 'sm',
                    'max-w-xl': size === 'md',
                    'max-w-2xl': size === 'lg',
                    'max-w-4xl': size === 'xl',
                  })}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-10 flex pr-4 pt-4">
                      <button
                        type="button"
                        className="relative cursor-default rounded-md text-gray-300 hover:text-white focus:outline-none"
                        onClick={onClose}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <FontAwesomeIcon icon={faClose} className="h-6 w-6" aria-hidden="true" />
                        {/*<XMarkIcon className="h-6 w-6" aria-hidden="true" />*/}
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="h-full overflow-y-auto bg-gray-100 p-8 text-gray-900 shadow-xl dark:bg-bright-gray-950 dark:text-indigo-50">
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
