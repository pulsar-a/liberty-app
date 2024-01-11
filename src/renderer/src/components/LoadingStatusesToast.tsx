import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { grabSortedItems, useLoadingStatusesStore } from '../store/useLoadingStatusesStore'
import { LoadingStatusEntry } from './LoadingStatusEntry'
import { Toast } from './Toast'

export const LoadingStatusesToast: React.FC = () => {
  const { t } = useTranslation()
  const { addItem, setItemStatus, clearFinished } = useLoadingStatusesStore()
  const items = useLoadingStatusesStore(grabSortedItems)

  window.api.onAddLoaders((itemsToAdd) => {
    itemsToAdd.forEach((item) => {
      console.log('Adding item', item)
      addItem(item)
    })
  })

  window.api.onUpdateLoader((item) => {
    setItemStatus(item.id, item.status, item.label ? t(item.label, item.labelParams) : undefined)
  })

  const hasManyFinished =
    items.filter((item) => ['success', 'error'].includes(item.status)).length > 1

  return (
    <Toast show={items.length > 0}>
      {hasManyFinished && (
        <div className="border-bright-gray-30 -mx-4 flex justify-end border-b px-4 py-2 dark:border-bright-gray-600">
          <button
            className="text-xs text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            onClick={() => clearFinished()}
          >
            {t('loadingStatusesToast_clearFinished_label')}
            <FontAwesomeIcon icon={faTrash} className="ml-1" size="sm" />
          </button>
        </div>
      )}
      <div className="-mx-4 max-h-56 overflow-auto">
        {items.map((item) => (
          <LoadingStatusEntry key={item.id} item={item} />
        ))}
      </div>
    </Toast>
  )
}
