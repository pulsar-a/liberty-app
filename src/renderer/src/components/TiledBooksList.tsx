import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: BookEntity[]
}

export const TiledBooksList: React.FC<BooksListProps> = ({ books }) => {
  const navigate = useNavigate({ from: '/' })

  const handleBookClick = (book: BookEntity) => {
    navigate({ to: '/book/$bookId', params: { bookId: book.id } })
      .then()
      .catch(console.error)
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-y-10 sm:gap-x-6 lg:grid-cols-2 lg:gap-x-3 xl:grid-cols-4 2xl:grid-cols-5">
      {books.map((book) => (
        <BookTile
          book={book}
          key={book.id}
          onClick={() => {
            handleBookClick(book)
          }}
        />
      ))}
    </div>
  )
}
