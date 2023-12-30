import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutThreeSections } from '../layouts/parts/LayoutThreeSections'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()

  const [filePath, setFilePath] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)

  const [authors] = useState([
    { id: 1, name: 'Stephen King' },
    { id: 2, name: 'Sir Arthur Conan Doyle' },
  ])

  const uploadFile = async () => {
    const filePath = await window.api.openFile()
    setFilePath(filePath)
  }

  window.api.onUpdateCounter((counter) => {
    setCount(counter)
    console.log('counter', counter)
  })

  return (
    <>
      <LayoutThreeSections
        content={
          <div>
            <div>{t('libraryView_title')}</div>
            <div>=== FILE PATH: {filePath}</div>
            <div>=== Counter: {count}</div>
            <button onClick={uploadFile}>Upload File</button>
          </div>
        }
        sidebar={authors.map((author) => (
          <div key={author.id} className="flex items-center gap-x-4">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{author.name}</span>
          </div>
        ))}
      />
    </>
  )
}
