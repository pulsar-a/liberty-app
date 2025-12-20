import { RouteEntry } from '@app-types/router.types'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { faPlusCircle as faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BooksGrid } from '../components/BooksGrid'
import { Button } from '../components/Button'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { DialogWindow } from '../components/DialogWindow'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageTitle } from '../components/PageTitle'
import { TextInput } from '../components/TextInput'
import { useIpc } from '../hooks/useIpc'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { myCollectionsRoute } from '../routes/routes'

export const MyCollectionsView: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { collectionId } = myCollectionsRoute.useSearch()
  const { main } = useIpc()
  const utils = main.useUtils()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [collectionToDelete, setCollectionToDelete] = useState<{
    id: number
    name: string
  } | null>(null)

  // Fetch all collections
  const { data: collectionsData, isLoading: isLoadingCollections } = main.getCollections.useQuery(
    undefined,
    {
      queryKey: ['getCollections'],
    }
  )

  // Fetch selected collection with books
  const { data: selectedCollection, isLoading: isLoadingSelected } =
    main.getCollectionById.useQuery(
      { id: collectionId! },
      {
        queryKey: ['getCollectionById', { id: collectionId }],
        enabled: collectionId !== undefined,
      }
    )

  // Create collection mutation
  const createCollectionMutation = main.createCollection.useMutation({
    onSuccess: (newCollection) => {
      setNewCollectionName('')
      setShowCreateDialog(false)
      utils.invalidate(undefined, { queryKey: ['getCollections'] })
      // Navigate to the new collection
      if (newCollection) {
        navigate({
          to: '/my-collections',
          search: { collectionId: newCollection.id },
        })
      }
    },
  })

  // Delete collection mutation
  const deleteCollectionMutation = main.deleteCollection.useMutation({
    onSuccess: () => {
      setCollectionToDelete(null)
      utils.invalidate(undefined, { queryKey: ['getCollections'] })
      // Navigate away if we deleted the currently selected collection
      if (collectionToDelete && collectionToDelete.id === collectionId) {
        navigate({
          to: '/my-collections',
          search: {},
        })
      }
    },
  })

  // Transform collections to RouteEntry format
  const collections: RouteEntry[] = (collectionsData || []).map((collection) => ({
    id: collection.id,
    name: collection.name,
    to: '/my-collections',
    search: { collectionId: collection.id },
    badge: collection.booksCount > 0 ? collection.booksCount.toString() : undefined,
  }))

  const selectedCollectionName = collectionId
    ? collections.find((c) => c.id === collectionId)?.name || t('myCollectionsView_loading', 'Loading...')
    : t('myCollectionsView_allCollections', 'All Collections')

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollectionMutation.mutate({ name: newCollectionName.trim() })
    }
  }

  const handleDeleteCollection = (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCollectionToDelete({ id, name })
  }

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate({ id: collectionToDelete.id })
    }
  }

  return (
    <>
      <ThreeSectionsLayout
        content={
          <div className="px-4 pb-36 lg:px-8">
            <div className="flex items-baseline justify-between">
              <PageTitle
                title={t('myCollectionsView_title')}
                subtitle={selectedCollectionName}
              />
            </div>

            {isLoadingSelected && collectionId ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : collectionId && selectedCollection ? (
              selectedCollection.books && selectedCollection.books.length > 0 ? (
                <BooksGrid books={selectedCollection.books} />
              ) : (
                <EmptyState
                  message={t('myCollectionsView_emptyCollection', 'No books in this collection')}
                  details={t(
                    'myCollectionsView_emptyCollectionHint',
                    'Add books to this collection from the book details page'
                  )}
                  type="info"
                />
              )
            ) : !collectionId ? (
              <EmptyState
                message={t('myCollectionsView_selectCollection', 'Select a collection')}
                details={t(
                  'myCollectionsView_selectCollectionHint',
                  'Choose a collection from the sidebar to view its books'
                )}
                type="info"
              />
            ) : null}
          </div>
        }
        sidebar={
          <div className="px-2 pt-2">
            <Button
              label={t('myCollectionView_createCollection_button')}
              shape="rounded"
              size="xl"
              leadingIcon={faPlus}
              block
              onClick={() => setShowCreateDialog(true)}
            />

            {isLoadingCollections ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : collections.length > 0 ? (
              <div className="pt-8">
                <ul className="space-y-1">
                  {collections.map((collection) => (
                    <li key={collection.id} className="group relative">
                      <SubmenuEntries items={[collection]} />
                      <button
                        onClick={(e) =>
                          handleDeleteCollection(
                            collection.id as number,
                            collection.name,
                            e
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title={t('myCollectionsView_deleteCollection', 'Delete collection')}
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('myCollectionsView_noCollections', 'No collections yet')}
              </p>
            )}
          </div>
        }
      />

      {/* Create Collection Dialog */}
      <DialogWindow
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false)
          setNewCollectionName('')
        }}
      >
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('myCollectionsView_createDialog_title', 'Create Collection')}
          </h2>
          <TextInput
            value={newCollectionName}
            onChange={setNewCollectionName}
            placeholder={t('myCollectionsView_createDialog_placeholder', 'Collection name')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateCollection()
              } else if (e.key === 'Escape') {
                setShowCreateDialog(false)
                setNewCollectionName('')
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              label={t('cancel')}
              variant="ghost"
              size="sm"
              shape="rounded"
              onClick={() => {
                setShowCreateDialog(false)
                setNewCollectionName('')
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
          </div>
        </div>
      </DialogWindow>

      {/* Delete Collection Confirmation */}
      <ConfirmationDialog
        title={t('myCollectionsView_deleteConfirmation_title', 'Delete Collection')}
        message={
          <>
            {t('myCollectionsView_deleteConfirmation_messagePart1', 'Are you sure you want to delete the')}{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              "{collectionToDelete?.name}"
            </span>{' '}
            {t('myCollectionsView_deleteConfirmation_messagePart2', 'collection? Books will not be deleted.')}
          </>
        }
        open={collectionToDelete !== null}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={confirmDeleteCollection}
      />
    </>
  )
}
