import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const LibraryView: React.FC = () => {
  const { t } = useTranslation()

  const [filePath, setFilePath] = useState<string | null>(null)
  const [count, setCount] = useState<number>(0)

  const uploadFile = async () => {
    const filePath = await window.api.openFile()
    setFilePath(filePath)
  }

  window.api.onUpdateCounter((counter) => {
    setCount(counter)
    console.log('counter', counter)
  })

  return (
    <main className="pl-60">
      <aside className="fixed bottom-0 left-20 top-16 w-60 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 md:px-8"></aside>
      <div className="px-4 py-10 sm:px-6 md:px-8 md:py-6">
        <div>{t('libraryView_title')}</div>
        <div>=== FILE PATH: {filePath}</div>
        <div>=== Counter: {count}</div>
        <button onClick={uploadFile}>Upload File</button>
      </div>
    </main>
  )
}
