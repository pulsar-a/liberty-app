import { Book } from '@app-types/books.types'
import React from 'react'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: Book[]
}

export const TiledBooksList: React.FC<BooksListProps> = ({ books }) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-y-10 sm:gap-x-6 lg:grid-cols-2 lg:gap-x-3 xl:grid-cols-4 2xl:grid-cols-5">
      {books.map((book) => (
        <BookTile book={book} key={book.id} />
      ))}
    </div>
  )
}
