import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { useIpc } from '@/hooks/useIpc'
import { formatDateDistance } from '@/utils/dateFormatter'
import { formatFileSize } from '@/utils/fileFormatter'
import { faHeart } from '@fortawesome/free-regular-svg-icons'
import { faBook, faClose, faFingerprint, faPlus, faTable } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLocation, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactShowMoreText from 'react-show-more-text'
import { BookCover } from '../components/BookCover'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { DataListEntry } from '../components/DataListEntry'
import { EmptyState } from '../components/EmptyState'
import { bookDetailsRoute } from '../routes/routes'

export const BookDetailsView: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { bookId } = bookDetailsRoute.useParams()
  const navigate = useNavigate({ from: `/book/${bookId}` })
  const { main } = useIpc()
  const utils = main.useUtils()
  console.log('RENDER: BookDetailsView')
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)

  const { data: book, isError } = main.getBookById.useQuery(
    { id: bookId },
    {
      queryKey: ['getBookById', { id: bookId }],
      suspense: true,
    }
  )

  const deleteMutation = main.removeBookById.useMutation({
    onSettled: async () => {
      await navigate({ to: '/', search: { ...location.search } })
      utils.invalidate(undefined, {
        queryKey: ['getBooks', undefined],
      })
    },
  })

  const onBookDelete = async () => {
    return deleteMutation.mutate({ id: bookId })
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
            className="relative ml-4 flex h-10 w-10 shrink-0 grow-0 cursor-default items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-bright-gray-950 dark:text-indigo-50 dark:hover:bg-bright-gray-900 dark:hover:text-indigo-100"
          >
            <span className="absolute -inset-1.5" />
            <FontAwesomeIcon icon={faHeart} className="h-6 w-6" aria-hidden="true" />
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
            icon={faHeart}
            className="h-4 w-4 pr-2 text-red-600"
            aria-hidden="true"
          />
        </h3>
        <ul role="list" className="mt-2 border-t border-indigo-600 dark:border-indigo-400">
          {book.bookIds.map((bookId) => (
            <li className="flex items-center justify-between gap-4 py-3" key={bookId.id}>
              <div className="text-3xl">&bull;</div>
              <div className="flex flex-grow flex-col justify-center">
                <p className="text-sm font-medium text-gray-900 dark:text-indigo-50">
                  {bookId.idVal}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faClose}
                className="cursor-pointer text-gray-900 transition-colors hover:text-indigo-500 dark:text-indigo-50 dark:hover:text-indigo-300"
              />
            </li>
          ))}
          <li className="flex items-center justify-center py-2">
            <Button
              label={t('bookDetailsView_addToCollection_title')}
              variant={'primary'}
              shape="rounded"
              size="xs"
              className="group -ml-1"
              leadingIcon={faPlus}
            />
          </li>
        </ul>
      </div>

      <div>
        <h3 className="flex cursor-default items-center justify-between font-medium text-gray-900 dark:text-indigo-50">
          {t('bookDetailsView_information_title')}
          <FontAwesomeIcon
            icon={faTable}
            className="h-4 w-4 pr-2 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
        </h3>
        <dl className="mt-2 divide-y divide-gray-400 border-t border-indigo-600 dark:divide-mako-900 dark:border-indigo-400">
          <DataListEntry label={t('bookDetailsView_bookFormat_label')}>
            <Badge label="epub" color="yellow" />
          </DataListEntry>
          <DataListEntry
            label={t('bookDetailsView_fileSize_label')}
            value={formatFileSize(book.fileSize || 0)}
          />
          <DataListEntry
            label={t('bookDetailsView_uploadedDate_label')}
            value={formatDateDistance(book.createdAt)}
          />
          <DataListEntry
            label={t('bookDetailsView_lastModified_label')}
            value={formatDateDistance(book.updatedAt)}
          />
          <DataListEntry
            label={t('bookDetailsView_fileName_label')}
            value={book.originalFileName}
            breakable
          />
        </dl>
      </div>

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
          title={t('bookDetailsView_bookDeleteConfirmation_title')}
          message={t('bookDetailsView_bookDeleteConfirmation_message')}
          open={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={onBookDelete}
        />
        <Button
          label={t('delete')}
          variant="danger"
          shape="rounded"
          isLoading={deleteMutation.isLoading}
          className="w-1/2"
          onClick={() => setShowDeleteConfirmation(true)}
        />
      </div>
    </div>
  )
}
