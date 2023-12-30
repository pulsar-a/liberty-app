import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutThreeSections } from '../layouts/parts/LayoutThreeSections'
import { SubmenuEntries } from '../layouts/parts/SubmenuEntries'

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
        sidebar={<SubmenuEntries items={authors} />}
      />
    </>
  )
}
