import { Book } from '@app-types/books.types'
import React from 'react'

type BookTileProps = {
  book: Book
}
export const BookTile: React.FC<BookTileProps> = ({ book }) => {
  return (
    <div
      key={book.id}
      className="group relative cursor-pointer rounded-lg bg-indigo-100 transition-all hover:opacity-95 hover:shadow-xl dark:bg-indigo-950"
    >
      <div className="aspect-h-3 aspect-w-2 h-96 w-full overflow-hidden rounded-t-lg">
        <img src={book.cover} alt="" className="h-full w-full object-cover object-center" />
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
