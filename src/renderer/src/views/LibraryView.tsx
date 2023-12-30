import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Book } from '../../../../types/books.types'
import { TiledBooksList } from '../components/TiledBooksList'
import { LayoutThreeSections } from '../layouts/parts/LayoutThreeSections'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'
import shuraleCover from '@/assets/images/shurale.png'
import langoliersCover from '@/assets/images/langoliers.png'
import reliquaryCover from '@/assets/images/reliquary.png'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()

  const [filePath, setFilePath] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)

  const [authors] = useState([
    { id: 1, name: 'Stephen King', current: true },
    { id: 2, name: 'Sir Arthur Conan Doyle', current: false },
  ])

  const uploadFile = async () => {
    const filePath = await window.api.openFile()
    setFilePath(filePath)
  }

  window.api.onUpdateCounter((counter) => {
    setCount(counter)
    console.log('counter', counter)
  })

  const books: Book[] = [
    {
      id: 1,
      name: 'Шүрәле',
      bookIdentifier: '1234567890',
      identifierType: 'ISBN',
      authors: [{ id: 1, name: 'Габдулла Тукай' }],
      image: shuraleCover,
    },
    {
      id: 2,
      name: 'Langoliers',
      bookIdentifier: 'B000FC0SIM',
      identifierType: 'ASIN',
      authors: [{ id: 2, name: 'Stephen King' }],
      image: langoliersCover,
    },
    {
      id: 3,
      name: 'Reliquary',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [
        { id: 3, name: 'Douglas Preston' },
        { id: 2, name: 'Lincoln Child' },
      ],
      image: reliquaryCover,
    },
    {
      id: 5,
      name: 'Reliquary',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [
        { id: 3, name: 'Douglas Preston' },
        { id: 2, name: 'Lincoln Child' },
      ],
      image: reliquaryCover,
    },
    {
      id: 6,
      name: 'Reliquary',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [
        { id: 3, name: 'Douglas Preston' },
        { id: 2, name: 'Lincoln Child' },
      ],
      image: shuraleCover,
    },
    {
      id: 98,
      name: 'Reliquary',
      bookIdentifier: '3234122343',
      identifierType: 'ISBN',
      authors: [
        { id: 3, name: 'Douglas Preston' },
        { id: 2, name: 'Lincoln Child' },
      ],
      image: langoliersCover,
    },
  ]

  return (
    <>
      <LayoutThreeSections
        content={
          <div>
            <TiledBooksList books={books} />
            {/*<div>{t('libraryView_title')}</div>*/}
            {/*<div>=== FILE PATH: {filePath}</div>*/}
            {/*<div>=== Counter: {count}</div>*/}
            {/*<button onClick={uploadFile}>Upload File</button>*/}
          </div>
        }
        sidebar={<SubmenuEntries items={authors} />}
      />
    </>
  )
}
