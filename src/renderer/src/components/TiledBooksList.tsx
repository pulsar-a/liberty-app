import React from 'react'
import { Book } from '@app-types/books.types'

type BooksListProps = {
  books: Book[]
}

export const TiledBooksList: React.FC<BooksListProps> = ({ books }) => {
  return (
    <div>
      <div className="px-4 lg:px-8 pb-36">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            All Books
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-y-10 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-x-6 lg:gap-x-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative bg-indigo-100 hover:shadow-xl transition-all dark:bg-indigo-950 rounded-lg hover:opacity-95"
            >
              <div className="h-96 w-full overflow-hidden rounded-lg aspect-h-3 aspect-w-2 border-2">
                <img
                  src={book.image}
                  alt={book.imageAlt}
                  className="h-full w-full object-cover object-center"
                />
              </div>

              <p className="mt-4 px-4 text-sm text-gray-500 dark:text-white">
                {book.authors.map((author) => author.name).join(', ')}
              </p>

              <h3 className="mt-1 px-4 pb-4 text-base font-semibold text-gray-900 dark:text-white">
                <span className="absolute inset-0" />
                {book.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
