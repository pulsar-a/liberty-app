import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import { BookLine } from './BookLine'

type BooksListProps = {
  books: BookEntity[]
}

export const BooksList: React.FC<BooksListProps> = ({ books }) => {
  return (
    <ul
      role="list"
      className="mt-8 flex flex-col divide-y divide-gray-200 rounded-xl shadow-md dark:divide-gray-700"
    >
      {books.map((book) => (
        <BookLine book={book} key={book.id} />
      ))}
    </ul>
  )
}
