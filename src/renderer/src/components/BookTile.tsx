import { clsx } from 'clsx'
import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import placeholderBlue from '../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../assets/images/placeholder-green.jpg'
import placeholderPink from '../assets/images/placeholder-pink.jpg'
import { getStableOptionForHash } from '../utils/hashSelector'

type BookTileProps = {
  book: BookEntity
  className?: string
  withGutter?: boolean
  onClick?: () => void
}
export const BookTile: React.FC<BookTileProps> = ({ book, withGutter, onClick, className }) => {
  const [isImageAvailable, setImageAvailable] = React.useState(true)

  const hasReadingProgress = book.readingProgress !== null && book.readingProgress !== undefined

  const hasAuthors = book.authors.length > 0

  const placeholder = getStableOptionForHash(book.id.toString(), [
    placeholderGreen,
    placeholderPink,
    placeholderBlue,
  ])

  return (
    <div
      key={book.id}
      className={clsx(
        'group relative w-72 cursor-default rounded-lg bg-indigo-800/70 transition-all hover:opacity-95 hover:shadow-xl dark:bg-indigo-500/30',
        className
      )}
      onClick={onClick}
    >
      <div
        className={clsx(
          'relative aspect-2/3 h-96 w-full overflow-hidden',
          withGutter ? 'rounded-t-lg' : 'rounded-lg'
        )}
        style={{
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
        }}
      >
        {hasReadingProgress && (
          <div className="absolute right-2 top-2 bg-amber-950/70 p-1 text-sm text-white">
            {book.readingProgress}%
          </div>
        )}
        {isImageAvailable && (
          <img
            src={'file://' + book.cover}
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
      </div>
      {withGutter && (
        <>
          <h3 className="mt-4 line-clamp-3 break-words px-4 text-base font-semibold text-white">
            {book.name}
          </h3>

          <div className="mb-4 mt-2 line-clamp-2 overflow-y-hidden break-words px-4 text-sm text-white">
            {book.authors.map((author) => author.name).join(', ')}
          </div>
        </>
      )}
    </div>
  )
}
