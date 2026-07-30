import { RouteEntry } from '@app-types/router.types'
import { faEllipsisVertical, faHeart, faTrash } from '@fortawesome/free-solid-svg-icons'
import { faPlusCircle as faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu } from '@headlessui/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
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

  const isFavoritesSelected = collectionId === 'favorites'

  // Fetch all collections
  const { data: collectionsData, isLoading: isLoadingCollections } = main.getCollections.useQuery(
    undefined
  )

  // Fetch favorites count for sidebar badge
  const { data: favoritesCount } = main.getFavoriteBooksCount.useQuery(undefined)

  // Fetch favorite books when favorites is selected
  const { data: favoriteBooks, isLoading: isLoadingFavorites } = main.getFavoriteBooks.useQuery(
    undefined,
    {
      enabled: isFavoritesSelected,
    }
  )

  // Fetch selected collection with books (only when a real collection is selected)
  const { data: selectedCollection, isLoading: isLoadingSelected } =
    main.getCollectionById.useQuery(
      { id: collectionId as number },
      {
        queryKey: ['getCollectionById', { id: collectionId }],
        enabled: collectionId !== undefined && !isFavoritesSelected,
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

  // Favorites entry (always at top)
  const favoritesEntry: RouteEntry = {
    id: 'favorites',
    name: t('favorites_title', 'Favorites'),
    to: '/my-collections',
    search: { collectionId: 'favorites' },
    count: favoritesCount || 0,
    icon: faHeart,
    variant: 'favorite',
  }

  // Transform collections to RouteEntry format
  const collections: RouteEntry[] = (collectionsData || []).map((collection) => ({
    id: collection.id,
    name: collection.name,
    to: '/my-collections',
    search: { collectionId: collection.id },
    count: collection.booksCount,
  }))

  const selectedCollectionName = isFavoritesSelected
    ? t('favorites_title', 'Favorites')
    : collectionId
      ? collections.find((c) => c.id === collectionId)?.name || t('myCollectionsView_loading', 'Loading...')
      : t('myCollectionsView_allCollections', 'All Collections')

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollectionMutation.mutate({ name: newCollectionName.trim() })
    }
  }

  const handleDeleteCollection = (id: number, name: string) => {
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

            {/* Loading state */}
            {((isLoadingSelected && collectionId && !isFavoritesSelected) ||
              (isLoadingFavorites && isFavoritesSelected)) && (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {/* Favorites content */}
            {isFavoritesSelected && !isLoadingFavorites && (
              favoriteBooks && favoriteBooks.length > 0 ? (
                <BooksGrid books={favoriteBooks} />
              ) : (
                <EmptyState
                  message={t('favorites_empty', 'No favorite books yet')}
                  details={t(
                    'favorites_empty_hint',
                    'Click the heart icon on any book to add it to favorites'
                  )}
                  type="info"
                />
              )
            )}

            {/* Regular collection content */}
            {collectionId && !isFavoritesSelected && selectedCollection && !isLoadingSelected && (
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
            )}

            {/* No collection selected */}
            {!collectionId && (
              <EmptyState
                message={t('myCollectionsView_selectCollection', 'Select a collection')}
                details={t(
                  'myCollectionsView_selectCollectionHint',
                  'Choose a collection from the sidebar to view its books'
                )}
                type="info"
              />
            )}
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

            {/* Favorites entry - always at top */}
            <div className="pt-4">
              <SubmenuEntries items={[favoritesEntry]} />
            </div>

            {isLoadingCollections ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : collections.length > 0 ? (
              <div className="pt-4">
                <ul className="space-y-1">
                  {collections.map((collection) => (
                    <li
                      key={collection.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1"
                    >
                      <Link
                        to="/my-collections"
                        search={{ collectionId: collection.id as number }}
                        activeOptions={{ exact: true, includeSearch: true }}
                        activeProps={{
                          className:
                            'border-indigo-500 bg-indigo-300 font-semibold dark:border-white/50 dark:bg-white/10 dark:text-white',
                        }}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center rounded-md border-r-4 border-transparent py-2 pl-3 pr-2 text-sm font-medium text-gray-900 hover:border-black hover:bg-gray-600/15 dark:text-gray-300 dark:hover:border-white dark:hover:bg-white/15"
                      >
                        <span className="truncate" title={collection.name}>
                          {collection.name}
                        </span>
                        <span className="ml-2 shrink-0 rounded-full bg-gray-400/30 px-2 py-0.5 text-xs tabular-nums text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          {collection.count}
                        </span>
                      </Link>
                      <Menu as="div" className="relative">
                        <Menu.Button
                          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-600/15 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-gray-400 dark:hover:bg-white/15 dark:hover:text-white"
                          aria-label={t(
                            'myCollectionsView_collectionActions',
                            `Actions for ${collection.name}`
                          )}
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 z-20 mt-1 w-44 origin-top-right rounded-md border border-gray-200 bg-white p-1 shadow-lg focus:outline-none dark:border-gray-600 dark:bg-gray-800">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCollection(
                                    collection.id as number,
                                    collection.name
                                  )
                                }
                                className={clsx(
                                  'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 dark:text-red-400',
                                  active && 'bg-red-50 dark:bg-red-900/30'
                                )}
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                                {t('myCollectionsView_deleteCollection', 'Delete collection')}
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
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
              &ldquo;{collectionToDelete?.name}&rdquo;
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
