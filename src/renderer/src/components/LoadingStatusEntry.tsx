import { LoadingStatusItem } from '@app-types/loader.types'
import { faCheckCircle, faClose, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { animated, useSpring } from '@react-spring/web'
import { clsx } from 'clsx'
import React from 'react'
import { GridLoader } from 'react-spinners'
import { useLoadingStatusesStore } from '../store/useLoadingStatusesStore'

type LoadingStatusEntryProps = {
  item: LoadingStatusItem
}

export const LoadingStatusEntry: React.FC<LoadingStatusEntryProps> = ({ item }) => {
  const { removeItem } = useLoadingStatusesStore()
  const [springs, api] = useSpring(() => ({
    delay: 50,
    from: { opacity: 1 },
    onRest: () => {
      removeItem(item.id)
    },
  }))

  const removeLine = async () => {
    api.start({
      from: { opacity: 1 },
      to: { opacity: 0 },
    })
  }

  return (
    <animated.div
      key={item.id}
      className={clsx(
        'flex items-center border-bright-gray-300 py-2 pl-2 pr-4 shadow-inner not-last:border-b dark:border-bright-gray-600'
      )}
      style={{ ...springs }}
    >
      <div className="mr-2 flex w-6 shrink-0 items-center justify-center">
        {item.status === 'loading' && <GridLoader color="#1E90FF" size={3} />}
        {item.status === 'success' && (
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
        )}
        {item.status === 'error' && (
          <FontAwesomeIcon icon={faExclamationCircle} className="text-red-400" />
        )}
      </div>
      <div className="flex-grow py-1">
        <div
          className={clsx(
            'line-clamp-2 select-text overflow-hidden text-xs text-gray-950 dark:text-gray-50',
            item.status === 'error' && 'text-red-800 dark:text-red-300'
          )}
          title={item.label}
        >
          {item.label}
        </div>
        <div
          className={clsx(
            'line-clamp-2 select-text overflow-hidden text-[10px] text-gray-950 dark:text-gray-200'
          )}
          title={item.subLabel}
        >
          {item.subLabel}
        </div>
      </div>
      {item.status !== 'loading' && (
        <button
          className="pointer-events-auto flex w-5 shrink-0 cursor-default items-center justify-end"
          onClick={removeLine}
        >
          <span className="sr-only">Close</span>
          <FontAwesomeIcon
            icon={faClose}
            className="text-gray-800 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
          />
        </button>
      )}
    </animated.div>
  )
}
