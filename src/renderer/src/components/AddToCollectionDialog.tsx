import { faClose, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIpc } from '../hooks/useIpc'
import { Button } from './Button'
import { DialogWindow } from './DialogWindow'
import { LoadingSpinner } from './LoadingSpinner'
import { TextInput } from './TextInput'
import { Toggle } from './Toggle'

type AddToCollectionDialogProps = {
  bookId: number
  open: boolean
  onClose: () => void
}

export const AddToCollectionDialog: React.FC<AddToCollectionDialogProps> = ({
  bookId,
  open,
  onClose,
}) => {
  const { t } = useTranslation()
  const { main } = useIpc()
  const utils = main.useUtils()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  // Fetch all collections with book membership status
  const { data: collectionsData, isLoading } = main.getCollectionsWithBookMembership.useQuery(
    { bookId },
    {
      queryKey: ['getCollectionsWithBookMembership', { bookId }],
      enabled: open,
    }
  )

  const addToCollectionMutation = main.addBookToCollection.useMutation({
    onSuccess: () => {
      utils.invalidate(undefined, {
        queryKey: ['getCollectionsWithBookMembership', { bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getBookById', { id: bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getCollections'],
      })
    },
  })

  const removeFromCollectionMutation = main.removeBookFromCollection.useMutation({
    onSuccess: () => {
      utils.invalidate(undefined, {
        queryKey: ['getCollectionsWithBookMembership', { bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getBookById', { id: bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getCollections'],
      })
    },
  })

  const createCollectionMutation = main.createCollection.useMutation({
    onSuccess: (newCollection) => {
      setNewCollectionName('')
      setShowCreateForm(false)
      utils.invalidate(undefined, {
        queryKey: ['getCollectionsWithBookMembership', { bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getCollections'],
      })
      // Automatically add the book to the new collection
      if (newCollection) {
        addToCollectionMutation.mutate({ bookId, collectionId: newCollection.id })
      }
    },
  })

  const handleToggle = (collectionId: number, currentlyInCollection: boolean) => {
    if (currentlyInCollection) {
      removeFromCollectionMutation.mutate({ bookId, collectionId })
    } else {
      addToCollectionMutation.mutate({ bookId, collectionId })
    }
  }

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollectionMutation.mutate({ name: newCollectionName.trim() })
    }
  }

  const handleClose = () => {
    setShowCreateForm(false)
    setNewCollectionName('')
    onClose()
  }

  return (
    <DialogWindow open={open} onClose={handleClose} className="sm:max-w-md">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('addToCollectionDialog_title', 'Add to Collection')}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faClose} className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : collectionsData && collectionsData.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {collectionsData.map(({ collection, hasBook }) => (
                <li
                  key={collection.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {collection.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('addToCollectionDialog_booksCount', '{{count}} books', {
                        count: collection.booksCount,
                      })}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <Toggle
                      value={hasBook}
                      onChange={() => handleToggle(collection.id, hasBook)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('addToCollectionDialog_noCollections', 'No collections yet. Create one below.')}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          {showCreateForm ? (
            <div className="flex items-center gap-2">
              <TextInput
                value={newCollectionName}
                onChange={setNewCollectionName}
                placeholder={t('addToCollectionDialog_newCollectionPlaceholder', 'Collection name')}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCollection()
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false)
                    setNewCollectionName('')
                  }
                }}
              />
              <Button
                label={t('save')}
                variant="primary"
                size="sm"
                shape="rounded"
                onClick={handleCreateCollection}
                isLoading={createCollectionMutation.isLoading}
                disabled={!newCollectionName.trim()}
              />
              <Button
                label={t('cancel')}
                variant="ghost"
                size="sm"
                shape="rounded"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewCollectionName('')
                }}
              />
            </div>
          ) : (
            <Button
              label={t('addToCollectionDialog_createNew', 'Create new collection')}
              variant="ghost"
              size="sm"
              shape="rounded"
              leadingIcon={faPlus}
              onClick={() => setShowCreateForm(true)}
              block
            />
          )}
        </div>
      </div>
    </DialogWindow>
  )
}

