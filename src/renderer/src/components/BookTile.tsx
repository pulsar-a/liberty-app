import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import React from 'react'
import { useTranslation } from 'react-i18next'
import BookEntity from '../../../main/entities/book.entity'
import placeholderBlue from '../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../assets/images/placeholder-green.jpg'
import placeholderPink from '../assets/images/placeholder-pink.jpg'
import { getStableOptionForHash } from '../utils/hashSelector'
import { BookContextMenu } from './BookContextMenu'

type BookTileProps = {
  book: BookEntity
  className?: string
  withGutter?: boolean
}
export const BookTile: React.FC<BookTileProps> = ({ book, withGutter, className }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate({ from: location.pathname })

  const [isImageAvailable, setImageAvailable] = React.useState(true)

  const hasReadingProgress =
    book.readingProgress !== null &&
    book.readingProgress !== undefined &&
    book.totalPages !== null &&
    book.totalPages !== undefined &&
    book.totalPages > 0

  const progressPercentage = hasReadingProgress
    ? Math.round(((book.readingProgress! + 1) / book.totalPages!) * 100)
    : 0

  const hasAuthors = book.authors && book.authors.length > 0

  const placeholder = getStableOptionForHash(book.id.toString(), [
    placeholderGreen,
    placeholderPink,
    placeholderBlue,
  ])

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
    <div
      key={book.id}
      className={clsx(
        'group relative w-72 cursor-default rounded-lg bg-indigo-800/70 transition-all dark:bg-indigo-500/30',
        'hover:opacity-95 hover:shadow-xl',
        className
      )}
      onClick={openBookDetails}
    >
      <div
        className={clsx(
          'relative aspect-2/3 w-72 overflow-hidden',
          withGutter ? 'rounded-t-lg' : 'rounded-lg'
        )}
        style={{
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
        }}
      >
        <div
          className="absolute right-2 top-3 flex h-8 w-8 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <BookContextMenu book={book} />
        </div>

        {/* Reading progress badge */}
        {hasReadingProgress && (
          <div className="absolute right-2 top-12 rounded bg-amber-950/80 px-2 py-1 text-sm font-medium text-white shadow-lg">
            {progressPercentage}%
          </div>
        )}

        {book.cover && isImageAvailable && (
          <img
            src={'liberty-file://' + encodeURIComponent(book.cover)}
            onError={() => {
              setImageAvailable(false)
            }}
            alt=""
            className="h-full w-full object-fill object-center"
          />
        )}

        {/* IF NO COVER AVAILABLE */}
        {!book.cover || !isImageAvailable ? (
          <>
            <div className="absolute left-14 right-0 top-20 bg-amber-950/50 px-4 py-2">
              <div className="line-clamp-6 break-words text-right text-xl font-semibold text-orange-300">
                {book.name}
              </div>
            </div>
            {hasAuthors && (
              <div className="absolute bottom-10 left-0 mr-14 bg-amber-950/50 px-4 py-2">
                <div className="line-clamp-3 text-sm text-gray-100">
                  {book.authors.map((author) => (
                    <div key={author.id}>{author.name}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Reading progress bar at bottom */}
        {hasReadingProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Continue reading button on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
          <button
            onClick={openReader}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-500"
          >
            <FontAwesomeIcon icon={faBookOpen} className="h-4 w-4" />
            {hasReadingProgress
              ? t('book_continue_reading', 'Continue Reading')
              : t('book_start_reading', 'Start Reading')}
          </button>
        </div>
      </div>
      {withGutter && (
        <>
          <h3 className="mt-4 line-clamp-3 break-words px-4 text-base font-semibold text-white drop-shadow-sm">
            {book.name}
          </h3>

          <div className="mb-4 mt-2 line-clamp-2 overflow-y-hidden break-words px-4 text-sm text-white/90">
            {book.authors.map((author) => author.name).join(', ')}
          </div>
        </>
      )}
    </div>
  )
}
