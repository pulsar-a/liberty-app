import { faClose } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import React, { Fragment } from 'react'

type ToastProps = {
  show: boolean
  children: React.ReactNode
  withCloseButton?: boolean
  onCloseClick?: () => void
  className?: string
}

export const Toast: React.FC<ToastProps> = ({
  show,
  children,
  withCloseButton = false,
  onCloseClick,
  className,
}) => {
  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex select-none items-end px-8 pb-11 pt-4"
      >
        <div className="flex w-full flex-col items-end space-y-4">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition
            show={show}
            as={Fragment}
            enter="transform ease-out duration-300 transition"
            enterFrom="opacity-0 translate-y-0 translate-x-2"
            enterTo="translate-y-0 opacity-100 translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={clsx(
                'pointer-events-auto w-full max-w-sm overflow-hidden rounded-md bg-bright-gray-100 shadow-xl ring-1 ring-black ring-opacity-5 transition-colors dark:bg-mako-900',
                // !withCloseButton && 'transition-opacity hover:opacity-20',
                className
              )}
            >
              <div className="px-4">
                <div className="flex items-start justify-end">
                  <div className="flex-shrink flex-grow">{children}</div>

                  {withCloseButton && (
                    <div className="ml-6 mt-4 flex flex-shrink-0 flex-grow-0 basis-4">
                      <button
                        type="button"
                        className="inline-flex rounded-md bg-white text-gray-400 transition-colors hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-transparent dark:text-gray-500 dark:hover:text-gray-300"
                        onClick={onCloseClick}
                      >
                        <span className="sr-only">Close</span>
                        <FontAwesomeIcon icon={faClose} className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}
