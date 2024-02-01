// import { useSettings } from '../hooks/useSettings'
// import { bookDetailsRoute } from '../routes/routes'

import { faHeart } from '@fortawesome/free-regular-svg-icons'
import { faClose, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import BookEntity from '../../../main/entities/book.entity'
import { Badge } from '../components/Badge'
import { BookTile } from '../components/BookTile'
import { Button } from '../components/Button'
import { DataListEntry } from '../components/DataListEntry'
import { formatDateDistance } from '../utils/dateFormatter'
import { formatFileSize } from '../utils/fileFormatter'

export const BookDetailsView: React.FC = () => {
  // const { bookId } = bookDetailsRoute.useParams()
  // const { getSetting, setSetting } = useSettings()
  const isLoading = false

  if (isLoading) {
    return <div>Loading...</div>
  }

  const book: BookEntity = {
    name: 'Book name',
    authors: [
      {
        name: 'Author name',
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        books: [],
      },
      {
        name: 'Author name 2',
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        books: [],
      },
    ],
    id: 1,
    createdAt: new Date('2023-12-17 03:24:00'),
    updatedAt: new Date('2024-01-04 12:09:00'),
    originalFileName: 'my_awesome_book.epub',
    bookIds: [
      {
        id: 1,
        book: null,
        idType: 'ISBN',
        idVal: '978-3-16-148410-0',
      },
      {
        id: 2,
        book: null,
        idType: 'ASIN',
        idVal: 'B08Q5GQZQZ',
      },
      {
        id: 3,
        book: null,
        idType: 'Calibre ID',
        idVal: '99fe1086-7181-4fdb-b4d1-609a48e1d755 4ad891e5-2d54-4322-926c-2c93b1516b17',
      },
      {
        id: 3,
        book: null,
        idType: 'ID',
        idVal: '99fe1086-7181-4fdb-b4d1-609a48e1d755',
      },
    ],
    bookHash: '9re8ubc92bc90u8c',
    fileFormat: 'epub',
    fileName: 'books/b1be375f-af7b-4e45-9f9d-0ed24624cf58.epub',
    fileSize: 123456,
    cover: null,
    lang: 'en',
    publisher: 'Publisher name',
    score: 4.5,
    readingProgress: 50,
    description:
      'Book description is quite long and it is not easy to read it all, but it is possible to do it. I believe in you! You can do it! You can read it all! Can you? Or maybe not? Who knows?',
  }

  return (
    <div className="space-y-12 pb-16">
      <div>
        {/*<div className="aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg">*/}
        <div className="block w-full overflow-hidden rounded-lg">
          <BookTile book={book} />
        </div>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold leading-6 text-gray-900 dark:text-indigo-50">
              <span className="sr-only">Details for </span> {book.name}
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-indigo-200">
              {book.authors.map((author) => author.name).join(', ')}
            </p>
          </div>
          <button
            type="button"
            className="relative ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-bright-gray-950 dark:text-indigo-50 dark:hover:bg-bright-gray-900 dark:hover:text-indigo-100"
          >
            <span className="absolute -inset-1.5" />
            <FontAwesomeIcon icon={faHeart} className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Favorite</span>
          </button>
        </div>
      </div>
      <div className="">
        <h3 className="font-medium text-gray-900 dark:text-indigo-50">Description</h3>
        <div className="mt-2 flex items-center justify-between border-t border-gray-200 dark:border-indigo-400">
          <p className="mt-2 text-sm text-gray-500 dark:text-indigo-100">{book.description}</p>
          {/*<p className="text-sm italic text-gray-500">Add a description to this image.</p>*/}
          {/*<button*/}
          {/*  type="button"*/}
          {/*  className="relative -mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"*/}
          {/*>*/}
          {/*  <span className="absolute -inset-1.5" />*/}
          {/*  <FontAwesomeIcon icon={faClose} className="h-5 w-5" aria-hidden="true" />*/}
          {/*  /!*<PencilIcon className="h-5 w-5" aria-hidden="true" />*!/*/}
          {/*  <span className="sr-only">Add description</span>*/}
          {/*</button>*/}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-indigo-50">Information</h3>
        <dl className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200 dark:divide-mako-700 dark:border-indigo-400">
          <DataListEntry label="Book Format">
            <Badge label="epub" color="yellow" />
          </DataListEntry>
          <DataListEntry label="File Size" value={formatFileSize(book.fileSize || 0)} />
          <DataListEntry label="Uploaded" value={formatDateDistance(book.createdAt)} />
          <DataListEntry label="Last modified" value={formatDateDistance(book.updatedAt)} />
          <DataListEntry label="File name" value={book.originalFileName} />
        </dl>
      </div>

      <div className="mt-16">
        <h3 className="font-medium text-gray-900 dark:text-indigo-50">Book Identificators</h3>
        <ul
          role="list"
          className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200 dark:divide-mako-700 dark:border-indigo-400"
        >
          {book.bookIds.map((bookId) => (
            <li className="flex items-center justify-between gap-4 py-3" key={bookId.id}>
              <div>&bull;</div>
              <div className="flex flex-grow flex-col justify-center">
                <span className="text-xs uppercase dark:text-indigo-300">{bookId.idType}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-indigo-50">
                  {bookId.idVal}
                </p>
              </div>
              <FontAwesomeIcon icon={faClose} />
            </li>
          ))}
          <li className="flex items-center justify-between py-2">
            <Button
              label="Add identificator"
              variant={'primary'}
              shape="rounded"
              className="group -ml-1"
              leadingIcon={<FontAwesomeIcon icon={faPlus} className="h-5 w-5" aria-hidden="true" />}
            />
          </li>
        </ul>
      </div>
      <div className="flex justify-center pt-12">
        <Button label="Delete" variant="danger" shape="rounded" className="w-1/2" />
      </div>
    </div>
  )
}

/*
<div>
      <h2>Book Details</h2>
      <div>Book ID: {bookId}</div>

      {getSetting('currentlyReading') === Number(bookId) && (
        <div className="text-green-600">Currently reading</div>
      )}

      <Button
        label="READ"
        onClick={() => {
          setSetting('currentlyReading', Number(bookId))
        }}
      />
    </div>
 */
