import { useNavigate } from '@tanstack/react-router'
import React from 'react'
import { isDev } from '../../../main/constants/app'
import BookEntity from '../../../main/entities/book.entity'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: BookEntity[]
}

export const TiledBooksList: React.FC<BooksListProps> = ({ books }) => {
  const navigate = useNavigate({ from: '/' })

  const handleBookClick = (book: BookEntity) => {
    if (!isDev) {
      return
    }

    navigate({
      to: '/book/$bookId',
      params: { bookId: book.id },
      search: { flyout: true },
      mask: { to: '/' },
    })
      .then()
      .catch(console.error)
  }

  return (
    <div
      className="mt-6 grid gap-y-10 sm:gap-x-6 lg:gap-x-3"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {books.map((book) => (
        <BookTile
          book={book}
          key={book.id}
          withGutter={false}
          onClick={() => {
            handleBookClick(book)
          }}
          className="justify-self-center"
        />
      ))}
    </div>
  )
}
