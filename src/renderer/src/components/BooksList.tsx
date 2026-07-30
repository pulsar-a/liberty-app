import type { BookSummary } from '@app-types/books.types'
import React from 'react'
import { BookLine } from './BookLine'

type BooksListProps = {
  books: BookSummary[]
}

export const BooksList: React.FC<BooksListProps> = ({ books }) => {
  return (
    <ul
      role="list"
      className="mt-8 flex flex-col divide-y divide-gray-300 rounded-xl shadow-md dark:divide-gray-700"
    >
      {books.map((book) => (
        <BookLine book={book} key={book.id} />
      ))}
    </ul>
  )
}
