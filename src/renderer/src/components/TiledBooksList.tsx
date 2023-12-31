import { Book } from '@app-types/books.types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookTile } from './BookTile'

type BooksListProps = {
  books: Book[]
}

export const TiledBooksList: React.FC<BooksListProps> = ({ books }) => {
  const { t } = useTranslation()
  return (
    <div>
      <div className="px-4 pb-36 lg:px-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('libraryView_title')}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-y-10 sm:gap-x-6 lg:grid-cols-2 lg:gap-x-3 xl:grid-cols-4 2xl:grid-cols-5">
          {books.map((book) => (
            <BookTile book={book} key={book.id} />
          ))}
        </div>
      </div>
    </div>
  )
}
