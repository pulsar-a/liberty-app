import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: BookEntity[]
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
