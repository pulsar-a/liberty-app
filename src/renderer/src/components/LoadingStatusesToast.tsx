import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/i18n'
import { grabSortedItems, useLoadingStatusesStore } from '../store/useLoadingStatusesStore'
import { LoadingStatusEntry } from './LoadingStatusEntry'
import { Toast } from './Toast'

window.api.onAddLoaders((itemsToAdd) => {
  itemsToAdd.forEach((item) => {
    useLoadingStatusesStore.getState().addItem(item)
  })
})

window.api.onUpdateLoader((item) => {
  useLoadingStatusesStore
    .getState()
    .setItemStatus(
      item.id,
      item.status,
      item.label ? i18n.t(item.label, item.labelParams) : undefined,
      item.subLabel ? i18n.t(item.subLabel, item.subLabelParams) : undefined
    )
})

export const LoadingStatusesToast: React.FC = () => {
  const { t } = useTranslation()
  const { clearFinished } = useLoadingStatusesStore()
  const items = useLoadingStatusesStore(grabSortedItems)

  const hasManyFinishedItems =
    items.filter((item) => ['success', 'error'].includes(item.status)).length > 1

  return (
    <Toast show={items.length > 0}>
      {hasManyFinishedItems && (
        <div className="-mx-4 flex justify-end border-b border-bright-gray-200 bg-bright-gray-200 px-4 py-2 shadow dark:border-bright-gray-600 dark:bg-mako-800">
          <button
            className="flex items-center justify-end gap-0.5 text-xs text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
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
