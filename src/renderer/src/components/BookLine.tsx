import { useNavigate, useRouter } from '@tanstack/react-router'
import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import { BookContextMenu } from './BookContextMenu'
import { BookCover } from './BookCover'

type BookLineProps = {
  book: BookEntity
  onClick?: () => void
  onRemove?: () => void
}

export const BookLine: React.FC<BookLineProps> = ({ book }) => {
  const router = useRouter()
  const location = router.parseLocation()
  const navigate = useNavigate({ from: location.pathname })

  const openBookDetails = async () => {
    await navigate({
      to: '/book/$bookId',
      params: { bookId: book.id },
      search: { flyout: true, ...location.search },
      mask: { to: '/' },
    })
      .then()
      .catch(console.error)
  }

  return (
    <li
      key={book.id}
      className="flex justify-between gap-x-6 bg-gray-50 py-5 transition-all first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 hover:shadow-inner dark:bg-mako-950 dark:hover:bg-mako-950/90 dark:hover:shadow-inner"
      onClick={openBookDetails}
    >
      <div className="flex min-w-0 gap-x-4 pl-4">
        <BookCover book={book} size="sm" />
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-indigo-300">
            {book.name}
          </p>
          <p className="mt-1 flex text-xs leading-5 text-gray-700 dark:text-gray-200">
            {book.authors.map((author) => author.name).join(', ')}
          </p>
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-x-6 pr-6"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="hidden sm:flex sm:flex-col sm:items-end">
          {/*<p className="text-sm leading-6 text-gray-900 dark:text-gray-200">Role</p>*/}
          {/*<div className="mt-1 flex items-center gap-x-1.5">*/}
          {/*  <div className="flex-none rounded-full bg-emerald-500/20 p-1">*/}
          {/*    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />*/}
          {/*  </div>*/}
          {/*  <p className="text-xs leading-5 text-gray-500 dark:text-gray-200">Online</p>*/}
          {/*</div>*/}
        </div>
        <BookContextMenu book={book} />
      </div>
    </li>
  )
}
