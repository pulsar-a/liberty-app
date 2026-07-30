import type { BookSummary } from '@app-types/books.types'
import React from 'react'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: BookSummary[]
}

export const BooksGrid: React.FC<BooksListProps> = ({ books }) => {
  return (
    <div
      className="mt-6 grid gap-y-10 sm:gap-x-6 lg:gap-x-3"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {books.map((book) => (
        <BookTile book={book} key={book.id} withGutter={false} className="justify-self-center" />
      ))}
    </div>
  )
}
