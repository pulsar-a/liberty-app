import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { useIpc } from '@/hooks/useIpc'
import { useSettings } from '@/hooks/useSettings'
import { formatDateDistance } from '@/utils/dateFormatter'
import { formatFileSize } from '@/utils/fileFormatter'
import type { BookFile } from '@app-types/books.types'
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons'
import {
  faBook,
  faCheck,
  faFile,
  faFingerprint,
  faHeart as faHeartSolid,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactShowMoreText from 'react-show-more-text'
import { AddToCollectionDialog } from '../components/AddToCollectionDialog'
import { BookCover } from '../components/BookCover'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { DialogWindow } from '../components/DialogWindow'
import { EmptyState } from '../components/EmptyState'

type BookDetailsViewProps = {
  bookId: number
}

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({ bookId }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { main } = useIpc()
  const utils = main.useUtils()
  const { getSetting, setSetting } = useSettings()
  console.log('RENDER: BookDetailsView')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [showAddToCollectionDialog, setShowAddToCollectionDialog] = useState<boolean>(false)
  const [fileToRemove, setFileToRemove] = useState<BookFile | null>(null)
  const [showLastFileChoice, setShowLastFileChoice] = useState(false)
  const [neverAskLastFileChoice, setNeverAskLastFileChoice] = useState(false)
  const [mergeCandidateId, setMergeCandidateId] = useState<number | null>(null)
  const [collectionToRemove, setCollectionToRemove] = useState<{
    id: number
    name: string
  } | null>(null)

  const { data: book, isError } = main.getBookById.useQuery(
    { id: bookId },
    {
      queryKey: ['getBookById', { id: bookId }],
      suspense: true,
    }
  )

  const deleteMutation = main.removeBookById.useMutation({
    onSettled: async () => {
      // Close the flyout by removing bookId from search params
      await navigate({
        search: { bookId: undefined } as never,
      })
      utils.invalidate(undefined, {
        queryKey: ['getBooks', undefined],
      })
    },
  })

  const removeFromCollectionMutation = main.removeBookFromCollection.useMutation({
    onSuccess: () => {
      utils.invalidate(undefined, {
        queryKey: ['getBookById', { id: bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getCollections'],
      })
      setCollectionToRemove(null)
    },
  })

  const toggleFavoriteMutation = main.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.invalidate(undefined, {
        queryKey: ['getBookById', { id: bookId }],
      })
      utils.invalidate(undefined, {
        queryKey: ['getFavoriteBooks'],
      })
      utils.invalidate(undefined, {
        queryKey: ['getFavoriteBooksCount'],
      })
    },
  })

  const invalidateBook = () => {
    utils.invalidate(undefined, { queryKey: ['getBookById', { id: bookId }] })
    utils.invalidate(undefined, { queryKey: ['getBooks', undefined] })
  }
  const removeFileMutation = main.removeBookFile.useMutation({
    onSuccess: () => {
      setFileToRemove(null)
      setShowLastFileChoice(false)
      setNeverAskLastFileChoice(false)
      invalidateBook()
    },
  })
  const preferredFileMutation = main.setPreferredBookFile.useMutation({
    onSuccess: invalidateBook,
  })
  const mergeMutation = main.mergeBooks.useMutation({
    onSuccess: async (result) => {
      if (!result) return
      setMergeCandidateId(null)
      await navigate({ to: '/', search: { bookId: result.survivingBookId } })
      utils.invalidate()
    },
  })
  const dismissMatchMutation = main.dismissBookMatch.useMutation({
    onSuccess: invalidateBook,
  })

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate({ bookId })
  }

  const onBookDelete = async () => {
    return deleteMutation.mutate({ id: bookId })
  }

  const requestBookDeletion = () => {
    const confirmDelete = getSetting('confirmDeleteBook', true)
    if (confirmDelete) {
      setShowDeleteConfirmation(true)
    } else {
      onBookDelete()
    }
  }

  const handleNeverAskBeforeDeletingBook = (value: boolean) => {
    if (value) {
      setSetting('confirmDeleteBook', false)
    }
  }

  const requestFileRemoval = (file: BookFile) => {
    setFileToRemove(file)
    if (book?.activeFileCount === 1 && file.isAvailable) {
      const confirmLastFileRemoval = getSetting('confirmLastBookFileRemoval', true)
      if (confirmLastFileRemoval) {
        setShowLastFileChoice(true)
        return
      }

      const rememberedAction = getSetting('lastBookFileRemovalAction', 'keepBook')
      if (rememberedAction === 'deleteBook') {
        onBookDelete()
      } else {
        removeFileMutation.mutate({ bookFileId: file.id })
      }
    }
  }

  const removeSelectedFile = () => {
    if (fileToRemove) removeFileMutation.mutate({ bookFileId: fileToRemove.id })
  }

  const rememberLastFileChoice = (action: 'keepBook' | 'deleteBook') => {
    if (!neverAskLastFileChoice) return
    setSetting('lastBookFileRemovalAction', action)
    setSetting('confirmLastBookFileRemoval', false)
  }

  const closeLastFileChoice = () => {
    setShowLastFileChoice(false)
    setNeverAskLastFileChoice(false)
    setFileToRemove(null)
  }

  const readFile = async (file: BookFile) => {
    if (!file.isReadable) return
    await preferredFileMutation.mutateAsync({ bookId, bookFileId: file.id })
    await navigate({ to: '/reader/$bookId', params: { bookId: bookId.toString() } })
  }

  const handleRemoveFromCollection = (collectionId: number, collectionName: string) => {
    const confirmRemove = getSetting('confirmRemoveFromCollection', true)
    if (confirmRemove) {
      setCollectionToRemove({ id: collectionId, name: collectionName })
    } else {
      removeFromCollectionMutation.mutate({ bookId, collectionId })
    }
  }

  const confirmRemoveFromCollection = () => {
    if (collectionToRemove) {
      removeFromCollectionMutation.mutate({
        bookId,
        collectionId: collectionToRemove.id,
      })
    }
  }

  const handleNeverAskAgain = (value: boolean) => {
    if (value) {
      setSetting('confirmRemoveFromCollection', false)
    }
  }

  if (!book || isError) {
    return (
      <EmptyState
        message={t('bookDetailsView_notFound_message')}
        details={t('bookDetailsView_notFound_details')}
        type="error"
      />
    )
  }

  return (
    <div className="space-y-16 pb-16">
      <div>
        <div className="block w-full overflow-hidden rounded-lg">
          <BookCover book={book} size="lg" withTitle />
        </div>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-indigo-50">
              {book.name}
            </h2>
            <p className="text-sm font-medium text-gray-800 dark:text-indigo-200">
              {book.authors.map((author) => author.name).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={toggleFavoriteMutation.isLoading}
            className={clsx(
              'relative ml-4 flex h-10 w-10 shrink-0 grow-0 cursor-default items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2',
              book.isFavorite
                ? 'bg-rose-100 text-rose-500 hover:bg-rose-200 hover:text-rose-600 focus:ring-rose-400 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60 dark:hover:text-rose-300'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:ring-indigo-500 dark:bg-bright-gray-950 dark:text-indigo-50 dark:hover:bg-bright-gray-900 dark:hover:text-indigo-100',
              toggleFavoriteMutation.isLoading && 'opacity-50'
            )}
            title={
              book.isFavorite
                ? t('bookDetailsView_removeFromFavorites', 'Remove from favorites')
                : t('bookDetailsView_addToFavorites', 'Add to favorites')
            }
          >
            <span className="absolute -inset-1.5" />
            <FontAwesomeIcon
              icon={book.isFavorite ? faHeartSolid : faHeartOutline}
              className={clsx('h-6 w-6', book.isFavorite && 'text-rose-500 dark:text-rose-400')}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <div>
        <h3 className="flex cursor-default items-center justify-between font-medium text-gray-900 dark:text-indigo-50">
          {t('bookDetailsView_description_title')}
          <FontAwesomeIcon
            icon={faBook}
            className="h-4 w-4 pr-2 text-blue-600"
            aria-hidden="true"
          />
        </h3>
        <div className="mt-2 flex items-center justify-between border-t border-indigo-600 dark:border-indigo-400">
          {book.description ? (
            <div className="mt-2 text-sm text-gray-950 dark:text-indigo-100">
              <ReactShowMoreText
                lines={2}
                more={t('showMore')}
                less={t('showLess')}
                anchorClass="text-indigo-700 dark:text-indigo-300 cursor-default"
                truncatedEndingComponent={'... '}
              >
                {book.description}
              </ReactShowMoreText>
            </div>
          ) : (
            <>
              <div className="flex h-8 w-full items-center text-sm italic text-gray-500">
                {t('bookDetailsView_noDescription')}
              </div>
              {/* INFO: Button to edit description */}
              {/*<button*/}
              {/*  type="button"*/}
              {/*  className="relative ml-4 flex h-10 w-10 cursor-default items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-bright-gray-950 dark:text-indigo-50 dark:hover:bg-bright-gray-900 dark:hover:text-indigo-100"*/}
              {/*>*/}
              {/*  <span className="absolute -inset-1.5" />*/}
              {/*  <FontAwesomeIcon icon={faEdit} className="h-4 w-4" aria-hidden="true" />*/}
              {/*</button>*/}
            </>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h3 className="flex cursor-default items-center justify-between font-medium text-gray-900 dark:text-indigo-50">
          {t('bookDetailsView_inCollections_title')}
          <FontAwesomeIcon
            icon={faHeartSolid}
            className="h-4 w-4 pr-2 text-red-600"
            aria-hidden="true"
          />
        </h3>
        <div className="mt-2 border-t border-indigo-600 dark:border-indigo-400">
          {book.collections && book.collections.length > 0 ? (
            <ul className="divide-y divide-gray-300 dark:divide-gray-700">
              {book.collections.map((collection) => (
                <li key={collection.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-indigo-100">
                    {collection.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCollection(collection.id, collection.name)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title={t('bookDetailsView_removeFromCollection', 'Remove from collection')}
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm italic text-gray-500 dark:text-gray-400">
              {t('bookDetailsView_notInCollections')}
            </p>
          )}
          <div className="flex justify-center pb-2 pt-2">
            <Button
              label={t('bookDetailsView_addToCollection_title')}
              variant={'primary'}
              shape="rounded"
              size="xs"
              className="group"
              leadingIcon={faPlus}
              onClick={() => setShowAddToCollectionDialog(true)}
            />
          </div>
        </div>

        <AddToCollectionDialog
          bookId={bookId}
          open={showAddToCollectionDialog}
          onClose={() => setShowAddToCollectionDialog(false)}
        />

        <ConfirmationDialog
          title={t(
            'bookDetailsView_removeFromCollectionConfirmation_title',
            'Remove from collection'
          )}
          message={
            <>
              {t(
                'bookDetailsView_removeFromCollectionConfirmation_messagePart1',
                'You really want to remove the book from the'
              )}{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                &ldquo;{collectionToRemove?.name}&rdquo;
              </span>{' '}
              {t('bookDetailsView_removeFromCollectionConfirmation_messagePart2', 'collection?')}
            </>
          }
          open={collectionToRemove !== null}
          onClose={() => setCollectionToRemove(null)}
          onConfirm={confirmRemoveFromCollection}
          showNeverAskAgain
          onNeverAskAgainChange={handleNeverAskAgain}
        />
      </div>

      <div>
        <h3 className="flex cursor-default items-center justify-between font-medium text-gray-900 dark:text-indigo-50">
          {t('bookDetailsView_files_title', 'Files and formats')}
          <FontAwesomeIcon
            icon={faFile}
            className="h-4 w-4 pr-2 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
        </h3>
        <div className="mt-2 space-y-3 border-t border-indigo-600 pt-3 dark:border-indigo-400">
          {book.files.length === 0 && (
            <p className="text-sm italic text-gray-500">
              {t('bookDetailsView_noFiles', 'This book has no file history.')}
            </p>
          )}
          {book.files.map((file) => (
            <div
              key={file.id}
              className={clsx(
                'rounded-lg border p-3 text-sm',
                file.isAvailable
                  ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-mako-900/60'
                  : 'border-gray-200 bg-gray-100 opacity-70 dark:border-gray-700 dark:bg-mako-950'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label={file.fileFormat.toUpperCase()} color="yellow" />
                    {file.isPreferred && (
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                        {t('bookDetailsView_preferredFile', 'Preferred')}
                      </span>
                    )}
                    {!file.isAvailable && (
                      <span className="text-xs text-gray-500">
                        {t('bookDetailsView_removedFile', 'Removed')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 break-all font-medium text-gray-900 dark:text-indigo-50">
                    {file.originalFileName}
                  </p>
                  <p className="mt-1 break-all text-xs text-gray-500">{file.originalPath}</p>
                  <p className="mt-1 break-all text-xs text-gray-400">
                    {t('bookDetailsView_managedPath', 'Managed')}: {file.storedPath}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(file.fileSize || 0)} · {formatDateDistance(file.createdAt)} ·{' '}
                    {file.sourceLabel || file.sourceType}
                  </p>
                  {file.sha256 && (
                    <p className="mt-1 break-all font-mono text-[10px] text-gray-400">
                      SHA-256 {file.sha256}
                    </p>
                  )}
                  {file.derivedFromBookFileId && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('bookDetailsView_derivedFrom', 'Derived from file #{{id}}', {
                        id: file.derivedFromBookFileId,
                      })}
                    </p>
                  )}
                </div>
                {file.isAvailable && (
                  <div className="flex shrink-0 flex-col gap-2">
                    {file.isReadable && (
                      <Button
                        label={t('book_read', 'Read')}
                        variant="primary"
                        shape="rounded"
                        size="xs"
                        onClick={() => readFile(file)}
                      />
                    )}
                    {file.isReadable && !file.isPreferred && (
                      <Button
                        label={t('bookDetailsView_makePreferred', 'Make preferred')}
                        variant="ghost"
                        shape="rounded"
                        size="xs"
                        onClick={() =>
                          preferredFileMutation.mutate({ bookId, bookFileId: file.id })
                        }
                      />
                    )}
                    <Button
                      label={t('bookDetailsView_removeFile', 'Remove file')}
                      variant="danger"
                      shape="rounded"
                      size="xs"
                      onClick={() => requestFileRemoval(file)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {book.matchSuggestions.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-indigo-50">
            {t('bookDetailsView_possibleDuplicates', 'Possible duplicates')}
          </h3>
          <div className="mt-2 space-y-3 border-t border-amber-500 pt-3">
            {book.matchSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
              >
                <p className="font-medium text-gray-900 dark:text-indigo-50">
                  {suggestion.candidate.name}
                </p>
                <p className="text-xs text-gray-500">
                  {suggestion.candidate.authors.map((author) => author.name).join(', ')}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {t('bookDetailsView_matchReason', 'Match: {{reason}} ({{confidence}}%)', {
                    reason: suggestion.reason.replace('_', ' '),
                    confidence: Math.round(suggestion.confidence * 100),
                  })}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    label={t('bookDetailsView_mergeBooks', 'Merge books')}
                    variant="primary"
                    shape="rounded"
                    size="xs"
                    onClick={() => setMergeCandidateId(suggestion.candidate.id)}
                  />
                  <Button
                    label={t('bookDetailsView_notDuplicate', 'Not a duplicate')}
                    variant="ghost"
                    shape="rounded"
                    size="xs"
                    onClick={() => dismissMatchMutation.mutate({ matchId: suggestion.id })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16">
        <h3 className="flex cursor-default items-center justify-between font-medium text-gray-900 dark:text-indigo-50">
          {t('bookDetailsView_bookIds_title')}
          <FontAwesomeIcon
            icon={faFingerprint}
            className="h-4 w-4 pr-2 text-green-600"
            aria-hidden="true"
          />
        </h3>
        <ul role="list" className="mt-2 border-t border-indigo-600 dark:border-indigo-400">
          {book.bookIds.map((bookId) => (
            <li className="flex items-center justify-between gap-4 py-3" key={bookId.id}>
              <div className="text-3xl">&bull;</div>
              <div className="flex flex-grow flex-col justify-center">
                <span className="text-xs uppercase dark:text-indigo-300">{bookId.idType}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-indigo-50">
                  {bookId.idVal}
                </p>
              </div>
              {/*<FontAwesomeIcon icon={faClose} />*/}
            </li>
          ))}
          {/*<li className="flex items-center py-2">*/}
          {/*  <Button*/}
          {/*    label={t('bookDetailsView_addId_title')}*/}
          {/*    variant={'primary'}*/}
          {/*    shape="rounded"*/}
          {/*    size="xs"*/}
          {/*    className="group -ml-1"*/}
          {/*    leadingIcon={faPlus}*/}
          {/*  />*/}
          {/*</li>*/}
        </ul>
      </div>
      <div className="flex justify-center pt-12">
        <ConfirmationDialog
          title={t('bookDetailsView_mergeBooks', 'Merge books')}
          message={t(
            'bookDetailsView_mergeConfirmation',
            'Merge these logical books? The oldest metadata entry will remain and every file, collection, bookmark, and reading position will be preserved.'
          )}
          open={mergeCandidateId !== null}
          onClose={() => setMergeCandidateId(null)}
          onConfirm={() => {
            if (mergeCandidateId !== null) {
              mergeMutation.mutate({ bookId, candidateBookId: mergeCandidateId })
            }
          }}
        />
        <ConfirmationDialog
          title={t('bookDetailsView_removeFile', 'Remove file')}
          message={t(
            'bookDetailsView_removeFileConfirmation',
            'Remove this managed file? Its provenance, checksum, cover, positions, and bookmarks will be kept.'
          )}
          open={Boolean(fileToRemove) && !showLastFileChoice}
          onClose={() => setFileToRemove(null)}
          onConfirm={removeSelectedFile}
        />
        <DialogWindow open={showLastFileChoice} onClose={closeLastFileChoice} persistent>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t('bookDetailsView_lastFileTitle', 'This is the last available file')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t(
              'bookDetailsView_lastFileMessage',
              'Keep the book and its metadata as a non-readable library entry, or delete the entire book and its history.'
            )}
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={neverAskLastFileChoice}
              onChange={(event) => setNeverAskLastFileChoice(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            {t('confirmationDialog_neverAskAgain', "Don't ask anymore")}
          </label>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              label={t('bookDetailsView_keepMetadata', 'Keep book metadata')}
              variant="primary"
              shape="rounded"
              size="lg"
              onClick={() => {
                rememberLastFileChoice('keepBook')
                removeSelectedFile()
              }}
            />
            <Button
              label={t('bookDetailsView_deleteEverything', 'Delete book and metadata')}
              variant="danger"
              shape="rounded"
              size="lg"
              onClick={() => {
                rememberLastFileChoice('deleteBook')
                onBookDelete()
              }}
            />
            <Button
              label={t('cancel', 'Cancel')}
              variant="ghost"
              shape="rounded"
              size="lg"
              onClick={closeLastFileChoice}
            />
          </div>
        </DialogWindow>
        <ConfirmationDialog
          title={t('bookDetailsView_bookDeleteConfirmation_title')}
          message={t('bookDetailsView_bookDeleteConfirmation_message')}
          open={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={onBookDelete}
          showNeverAskAgain
          onNeverAskAgainChange={handleNeverAskBeforeDeletingBook}
        />
        <Button
          label={t('delete')}
          variant="danger"
          shape="rounded"
          isLoading={deleteMutation.isLoading}
          className="w-1/2"
          onClick={requestBookDeletion}
        />
      </div>
    </div>
  )
}
