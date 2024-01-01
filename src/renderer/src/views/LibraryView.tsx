import cosmosCover from '@/assets/images/cosmos.png'
import faustCover from '@/assets/images/faust.png'
import kobzarCover from '@/assets/images/kobzar.png'
import langoliersCover from '@/assets/images/langoliers.png'
import reliquaryCover from '@/assets/images/reliquary.png'
import shuraleCover from '@/assets/images/shurale.png'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Book } from '../../../../types/books.types'
import { TiledBooksList } from '../components/TiledBooksList'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import { ThreeSectionsLayout } from '../layouts/parts/ThreeSectionsLayout'
import { libraryRoute } from '../routes/routes'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()
  const { authorId } = libraryRoute.useSearch()
  //** THESE ARE EXAMPLES OF IPC COMMUNICATION */
  //
  //
  const [filePath, setFilePath] = useState<string | null>(null)
  // const [count, setCount] = useState<number>(0)

  const uploadFile = async () => {
    const filePath = await window.api.openFile()
    setFilePath(filePath)
  }
  //
  // window.api.onUpdateCounter((counter) => {
  //   setCount(counter)
  //   console.log('counter', counter)
  // })

  const [authors] = useState([
    { id: 1, name: 'Stephen King', to: '/', search: { authorId: 1 } },
    { id: 2, name: 'Carl Sagan', to: '/', search: { authorId: 2 } },
    { id: 3, name: 'Габдулла Тукай', to: '/', search: { authorId: 3 } },
    { id: 4, name: 'Тарас Шевченко', to: '/', search: { authorId: 4 } },
    { id: 5, name: 'Douglas Preston', to: '/', search: { authorId: 5 } },
    { id: 6, name: 'Lincoln Child', to: '/', search: { authorId: 6 } },
    {
      id: 7,
      name: 'Johann Wolfgang von Goethe',
      to: '/',
      search: { authorId: 7 },
    },
  ])

  const books: Book[] = [
    {
      id: 1,
      name: 'Шүрәле',
      bookIdentifier: '1234567890',
      identifierType: 'ISBN',
      authors: [{ id: 3, name: 'Габдулла Тукай' }],
      image: shuraleCover,
    },
    {
      id: 2,
      name: 'Langoliers',
      bookIdentifier: 'B000FC0SIM',
      identifierType: 'ASIN',
      authors: [{ id: 1, name: 'Stephen King' }],
      image: langoliersCover,
    },
    {
      id: 3,
      name: 'Reliquary',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [
        { id: 5, name: 'Douglas Preston' },
        { id: 6, name: 'Lincoln Child' },
      ],
      image: reliquaryCover,
    },
    {
      id: 4,
      name: 'Кобзар',
      bookIdentifier: '1234567390',
      identifierType: 'ISBN',
      authors: [{ id: 4, name: 'Тарас Шевченко' }],
      image: kobzarCover,
    },
    {
      id: 5,
      name: 'Faust, Part One',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [{ id: 7, name: 'Johann Wolfgang von Goethe' }],
      image: faustCover,
    },
    {
      id: 6,
      name: 'Cosmos',
      bookIdentifier: '1234122343',
      identifierType: 'ISBN',
      authors: [{ id: 2, name: 'Carl Sagan' }],
      image: cosmosCover,
    },
  ]

  const filteredBooks = useMemo(() => {
    if (!authorId) {
      return books
    }
    return books.filter((book) => book.authors.some((author) => author.id === authorId))
  }, [books, authorId])

  const selectedAuthorName = useMemo(() => {
    const author = authors.find((author) => author.id === authorId)
    return author?.name
  }, [authors, authorId])

  return (
    <>
      <ThreeSectionsLayout
        content={
          <div className="px-4 pb-36 lg:px-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('libraryView_title')}
              </h2>
              {authorId && <h4 className="text-xl">{selectedAuthorName}</h4>}
            </div>
            {/*<div>{t('libraryView_title')}</div>*/}
            {filePath && <div>=== FILE PATH: {filePath}</div>}
            {filePath && <img src={filePath || ''} alt="" />}
            {/*<div>=== Counter: {count}</div>*/}
            {/*<button*/}
            {/*  className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"*/}
            {/*  onClick={uploadFile}*/}
            {/*>*/}
            {/*  Upload File*/}
            {/*</button>*/}
            <TiledBooksList books={filteredBooks} />
          </div>
        }
        sidebar={<SubmenuEntries items={authors} />}
      />
    </>
  )
}
