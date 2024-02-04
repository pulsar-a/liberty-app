import { clsx } from 'clsx'
import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import placeholderBlue from '../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../assets/images/placeholder-green.jpg'
import placeholderPink from '../assets/images/placeholder-pink.jpg'
import { getStableOptionForHash } from '../utils/hashSelector'

type BookCoverProps = {
  book: BookEntity
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  withTitle?: boolean
}

export const BookCover: React.FC<BookCoverProps> = ({ book, withTitle, size = 'md' }) => {
  const [isImageAvailable, setImageAvailable] = React.useState(true)

  const placeholder = getStableOptionForHash(book.id.toString(), [
    placeholderGreen,
    placeholderPink,
    placeholderBlue,
  ])

  const hasAuthors = book.authors.length > 0

  return (
    <div
      className={clsx(
        'relative aspect-2/3 shrink-0 grow-0',
        size === 'xs' && 'w-14 rounded',
        size === 'sm' && 'w-14 rounded',
        size === 'md' && 'h-56 rounded',
        size === 'lg' && 'h-96 rounded-lg',
        size === 'xl' && 'h-96 rounded-lg'
      )}
      style={{
        backgroundImage: `url(${placeholder})`,
        backgroundSize: 'cover',
      }}
    >
      <div
        className={clsx(
          'absolute bottom-0 top-0 border-l-2 border-mako-600',
          size === 'xl' && 'left-4 rounded-lg',
          size === 'lg' && 'left-3 rounded-lg',
          size === 'md' && 'left-2 rounded-lg',
          size === 'sm' && 'left-1 rounded-sm',
          size === 'xs' && 'left-1 rounded-sm'
        )}
      ></div>
      {isImageAvailable && (
        <img
          src={'file://' + book.cover}
          onError={() => {
            setImageAvailable(false)
          }}
          alt=""
          className={clsx(
            'h-full w-full rounded-lg object-fill object-center',
            size === 'xl' && 'rounded-lg',
            size === 'lg' && 'rounded-lg',
            size === 'md' && 'rounded-lg',
            size === 'sm' && 'rounded-sm',
            size === 'xs' && 'rounded-sm'
          )}
        />
      )}
      {withTitle && (!book.cover || !isImageAvailable) ? (
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
  )
}
