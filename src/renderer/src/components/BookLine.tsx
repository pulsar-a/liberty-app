import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'
import BookEntity from '../../../main/entities/book.entity'
import { BookContextMenu } from './BookContextMenu'
import { BookCover } from './BookCover'

type BookLineProps = {
  book: BookEntity
  onClick?: () => void
  onRemove?: () => void
}

export const BookLine: React.FC<BookLineProps> = ({ book }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate({ from: location.pathname })

  const hasReadingProgress =
    book.readingProgress !== null &&
    book.readingProgress !== undefined &&
    book.totalPages !== null &&
    book.totalPages !== undefined &&
    book.totalPages > 0

  const progressPercentage = hasReadingProgress
    ? Math.round(((book.readingProgress! + 1) / book.totalPages!) * 100)
    : 0

  const openBookDetails = async () => {
    await navigate({
      search: { ...location.search, bookId: book.id },
    })
      .then()
      .catch(console.error)
  }

  const openReader = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigate({
      to: '/reader/$bookId',
      params: { bookId: book.id.toString() },
    })
      .then()
      .catch(console.error)
  }

  return (
    <li
      key={book.id}
      className="flex justify-between gap-x-6 bg-gray-50 py-5 transition-all first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 hover:shadow-inner dark:bg-mako-950 dark:hover:bg-mako-950/90 dark:hover:shadow-inner"
      onClick={openBookDetails}
    >
      <div className="flex min-w-0 gap-x-4 pl-4">
        <div className="relative">
          <BookCover book={book} size="sm" />
          {/* Progress bar overlay on cover */}
          {hasReadingProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-indigo-300">
            {book.name}
          </p>
          <p className="mt-1 flex text-xs leading-5 text-gray-700 dark:text-gray-200">
            {book.authors?.map((author) => author.name).join(', ')}
          </p>
          {/* Reading progress text */}
          {hasReadingProgress && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('book_progress', '{{percent}}% complete', { percent: progressPercentage })}
            </p>
          )}
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-x-4 pr-6"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {/* Continue/Start reading button */}
        <button
          onClick={openReader}
          className={clsx(
            'hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex',
            hasReadingProgress
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          <FontAwesomeIcon icon={faBookOpen} className="h-3.5 w-3.5" />
          {hasReadingProgress ? t('book_continue', 'Continue') : t('book_read', 'Read')}
        </button>

        {/* Progress percentage badge */}
        {hasReadingProgress && (
          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400">
                {progressPercentage}%
              </span>
            </div>
          </div>
        )}

        <BookContextMenu book={book} />
      </div>
    </li>
  )
}
