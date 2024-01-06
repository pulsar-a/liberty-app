import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import placeholderBlue from '../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../assets/images/placeholder-green.jpg'
import placeholderPink from '../assets/images/placeholder-pink.jpg'

type BookTileProps = {
  book: BookEntity
  onClick?: () => void
}
export const BookTile: React.FC<BookTileProps> = ({ book, onClick }) => {
  const placeholders = [placeholderGreen, placeholderPink, placeholderBlue]

  const hasReadingProgress = book.readingProgress !== null && book.readingProgress !== undefined

  return (
    <div
      key={book.id}
      className="group relative cursor-default rounded-lg bg-indigo-800/70 transition-all hover:opacity-95 hover:shadow-xl dark:bg-indigo-500/30"
      onClick={onClick}
    >
      <div className="aspect-h-3 aspect-w-2 relative h-96 w-full overflow-hidden rounded-t-lg">
        {hasReadingProgress && (
          <div className="absolute right-2 top-2 bg-amber-950/70 p-1 text-sm text-white">
            {book.readingProgress}%
          </div>
        )}
        <img
          src={book.cover || placeholders[Math.floor(Math.random() * placeholders.length)]}
          alt=""
          className="h-full w-full object-cover object-center"
        />

        {/* IF NO COVER AVAILABLE */}
        {!book.cover && (
          <>
            <div className="absolute left-14 right-0 top-20 bg-amber-950/50 px-4 py-2">
              <div className="line-clamp-6 break-words text-right text-xl font-semibold text-orange-300">
                {book.name}
              </div>
            </div>
            <div className="absolute bottom-10 left-0 mr-14 bg-amber-950/50 px-4 py-2">
              <div className="line-clamp-3 text-sm text-gray-100">
                {book.authors.map((author) => (
                  <div key={author.id}>{author.name}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <h3 className="mt-4 line-clamp-3 break-words px-4 text-base font-semibold text-white">
        {book.name}
      </h3>

      <div className="mb-4 mt-2 line-clamp-2 overflow-y-hidden break-words px-4 text-sm text-white">
        {book.authors.map((author) => author.name).join(', ')}
      </div>
    </div>
  )
}
