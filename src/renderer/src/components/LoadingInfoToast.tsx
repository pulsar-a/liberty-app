import { faFile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { clsx } from 'clsx'
import { useLoadingStatusesStore } from '../store/useLoadingStatusesStore'
import { Toast } from './Toast'

export const LoadingInfoToast: React.FC = () => {
  const { items } = useLoadingStatusesStore()
  return (
    <Toast show={items.length > 0}>
      <div className="-mx-4 -mb-2 -mt-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={clsx(
              'flex items-end border-b px-4 pb-1 pt-4',
              item.status === 'success' && 'border-green-500',
              item.status === 'error' && 'border-red-700',
              item.status === 'loading' && 'border-indigo-400'
            )}
          >
            <FontAwesomeIcon icon={faFile} className="mb-1 mr-2" />
            <div className="line-clamp-2 overflow-hidden text-xs">{item.title}</div>
          </div>
        ))}
      </div>
    </Toast>
  )
}
