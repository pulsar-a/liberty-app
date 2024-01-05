import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import placeholderBlue from '../assets/images/placeholder-blue.jpg'
import placeholderGreen from '../assets/images/placeholder-green.jpg'
import placeholderPink from '../assets/images/placeholder-pink.jpg'

type BookTileProps = {
  book: BookEntity
}
export const BookTile: React.FC<BookTileProps> = ({ book }) => {
  const placeholders = [placeholderGreen, placeholderPink, placeholderBlue]

  const hasReadingProgress = book.readingProgress !== null && book.readingProgress !== undefined

  return (
    <div
      key={book.id}
      className="group relative cursor-pointer rounded-lg bg-indigo-100 transition-all hover:opacity-95 hover:shadow-xl dark:bg-indigo-950"
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
              <div className="line-clamp-6 text-right text-xl font-semibold text-orange-300">
                {book.name}
              </div>
            </div>
            <div className="absolute bottom-10 left-0 mr-14 bg-amber-950/50 px-4 py-2">
              <div className="line-clamp-3 text-sm text-gray-400">
                {book.authors.map((author) => (
                  <div key={author.id}>{author.name}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <h3 className="mt-4 px-4 text-base font-semibold text-gray-900 dark:text-white">
        <span className="absolute inset-0" />
        {book.name}
      </h3>

      <p className="mt-2 px-4 pb-4 text-sm text-gray-500 dark:text-white">
        {book.authors.map((author) => author.name).join(', ')}
      </p>
    </div>
  )
}
