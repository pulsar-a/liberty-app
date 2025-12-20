import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'
import placeholderBlue from '../../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../../assets/images/placeholder-green.jpg'
import placeholderPink from '../../assets/images/placeholder-pink.jpg'
import { getStableOptionForHash } from '../../utils/hashSelector'
import { Badge } from '../Badge'
import { HighlightedText } from './HighlightedText'

export interface BookSearchEntryData {
  id: number
  name: string
  cover: string | null
  authors: { id: number; name: string }[]
  fileFormat: string
  fileName: string
  originalFileName: string
  matchedField?: 'title' | 'book_id' | 'file_name' | 'internal_file_name'
  matchedBookId?: {
    idType: string
    idVal: string
  }
}

interface BookSearchEntryProps {
  book: BookSearchEntryData
  searchTerm: string
  showMatchedField?: boolean
  variant?: 'dropdown' | 'list'
  onSelect?: () => void
}

export const BookSearchEntry: React.FC<BookSearchEntryProps> = ({
  book,
  searchTerm,
  showMatchedField = false,
  variant = 'list',
  onSelect,
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate({ from: location.pathname })
  const [isImageAvailable, setImageAvailable] = React.useState(true)

  const placeholder = getStableOptionForHash(book.id.toString(), [
    placeholderGreen,
    placeholderPink,
    placeholderBlue,
  ])

  const handleClick = async () => {
    onSelect?.()
    await navigate({
      search: { ...location.search, bookId: book.id },
    }).catch(console.error)
  }

  const handleOpenReader = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
    await navigate({
      to: '/reader/$bookId',
      params: { bookId: book.id.toString() },
    }).catch(console.error)
  }

  const isDropdown = variant === 'dropdown'
  const hasAuthors = book.authors && book.authors.length > 0

  return (
    <div
      className={clsx(
        'group flex cursor-default items-start gap-4 transition-colors',
        isDropdown
          ? 'p-3 hover:bg-gray-100 dark:hover:bg-mako-700/50'
          : 'rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 dark:bg-mako-800/50 dark:ring-gray-700 dark:hover:ring-indigo-500/50'
      )}
      onClick={handleClick}
    >
      {/* Book cover thumbnail */}
      <div
        className={clsx(
          'relative shrink-0 overflow-hidden rounded-md bg-cover bg-center',
          isDropdown ? 'h-16 w-11' : 'h-24 w-16'
        )}
        style={{ backgroundImage: `url(${placeholder})` }}
      >
        {book.cover && isImageAvailable && (
          <img
            src={'liberty-file://' + encodeURIComponent(book.cover)}
            onError={() => setImageAvailable(false)}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Book info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h4
              className={clsx(
                'font-semibold text-gray-900 dark:text-white',
                isDropdown ? 'line-clamp-1 text-sm' : 'line-clamp-2 text-base'
              )}
            >
              {book.matchedField === 'title' ? (
                <HighlightedText text={book.name} highlight={searchTerm} />
              ) : (
                book.name
              )}
            </h4>

            {/* Authors */}
            {hasAuthors && (
              <p
                className={clsx(
                  'mt-1 text-gray-500 dark:text-gray-400',
                  isDropdown ? 'line-clamp-1 text-xs' : 'line-clamp-1 text-sm'
                )}
              >
                {book.authors.map((a) => a.name).join(', ')}
              </p>
            )}

            {/* Matched field info */}
            {showMatchedField && book.matchedField && book.matchedField !== 'title' && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {book.matchedField === 'book_id' && book.matchedBookId && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{book.matchedBookId.idType}:</span>
                    <HighlightedText text={book.matchedBookId.idVal} highlight={searchTerm} />
                  </div>
                )}
                {book.matchedField === 'file_name' && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{t('search_matched_fileName', 'File')}:</span>
                    <HighlightedText
                      text={book.originalFileName}
                      highlight={searchTerm}
                      className="truncate"
                    />
                  </div>
                )}
                {book.matchedField === 'internal_file_name' && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{t('search_matched_internalFileName', 'Internal')}:</span>
                    <HighlightedText
                      text={book.fileName}
                      highlight={searchTerm}
                      className="truncate font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Format badge */}
          <Badge
            label={book.fileFormat.toUpperCase()}
            color="indigo"
            className={clsx(isDropdown && 'text-xs')}
          />
        </div>

        {/* Open reader button (non-dropdown only) */}
        {!isDropdown && (
          <div className="mt-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleOpenReader}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              <FontAwesomeIcon icon={faBookOpen} className="h-3 w-3" />
              {t('book_start_reading', 'Start Reading')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

